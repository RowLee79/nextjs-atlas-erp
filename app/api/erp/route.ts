import {env} from "cloudflare:workers";

type Item={productId:number;quantity:number};
type Input={action?:string;[key:string]:unknown};
const db=()=>{if(!env.DB)throw Error("Database is unavailable.");return env.DB};
const str=(v:unknown,max=160)=>typeof v==="string"?v.trim().slice(0,max):"";
const positive=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>0&&v<=100000000;
const nonnegative=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<=100000000;
const fail=(message:string,status=400)=>Response.json({error:message},{status});
const now=()=>new Date().toISOString();
const safeError=(e:unknown)=>{console.error("ERP operation failed",e);return fail("The operation could not be completed. Please retry.",500)};

export async function GET(){
 try{
  const d=db();
  const [products,partners,orders,lines,expenses,employees]=await d.batch([
   d.prepare("SELECT * FROM products ORDER BY id DESC"),
   d.prepare("SELECT * FROM partners ORDER BY id DESC"),
   d.prepare("SELECT o.*,p.name AS partner_name FROM orders o LEFT JOIN partners p ON p.id=o.partner_id ORDER BY o.created_at DESC LIMIT 200"),
   d.prepare("SELECT * FROM order_lines ORDER BY id DESC LIMIT 1000"),
   d.prepare("SELECT * FROM expenses ORDER BY incurred_at DESC LIMIT 200"),
   d.prepare("SELECT * FROM employees ORDER BY id DESC")
  ]);
  return Response.json({products:products.results,partners:partners.results,orders:orders.results,lines:lines.results,expenses:expenses.results,employees:employees.results});
 }catch(e){return safeError(e)}
}

export async function POST(request:Request){
 let body:Input;
 try{body=await request.json() as Input}catch{return fail("Invalid request.")}
 try{
  const d=db(),date=now();
  if(body.action==="seed"){
   const existing=await d.prepare("SELECT COUNT(*) AS count FROM products").first<{count:number}>();
   if((existing?.count??0)>0)return fail("The workspace already contains products.",409);
   const productData=[
    ["PRD-001","Wireless Keyboard","Electronics",189900,119000,84,15],
    ["PRD-002","USB-C Docking Station","Electronics",459900,315000,18,12],
    ["PRD-003","Ergonomic Office Chair","Furniture",899000,620000,24,8],
    ["PRD-004","A4 Copy Paper (Box)","Office supplies",145000,93000,156,30],
    ["PRD-005","27-inch Monitor","Electronics",1299000,950000,12,10],
    ["PRD-006","Desk Organizer","Office supplies",75000,42000,92,20],
    ["PRD-007","Standing Desk","Furniture",1899000,1340000,7,5],
    ["PRD-008","Webcam HD 1080p","Electronics",249900,171000,31,10]
   ];
   const contacts=[
    ["customer","Meridian Technologies","procurement@meridian.ph","+63 917 555 1010","Makati"],
    ["customer","Northstar Retail Group","orders@northstar.ph","+63 917 555 1020","Taguig"],
    ["customer","Blue Harbor Studios","hello@blueharbor.ph","+63 917 555 1030","Pasig"],
    ["supplier","Pacific Distribution Co.","sales@pacific.ph","+63 917 555 2010","Pasay"],
    ["supplier","Summit Office Supply","accounts@summit.ph","+63 917 555 2020","Quezon City"]
   ];
   const statements=[
    ...productData.map(p=>d.prepare("INSERT INTO products(sku,name,category,price_cents,cost_cents,stock,reorder_level,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(...p,date)),
    ...contacts.map(c=>d.prepare("INSERT INTO partners(kind,name,email,phone,city,created_at) VALUES(?,?,?,?,?,?)").bind(...c,date)),
    d.prepare("INSERT INTO employees(name,role,department,email,status) VALUES(?,?,?,?,?)").bind("Sofia Reyes","Operations Manager","Operations","sofia@atlas.example","Active"),
    d.prepare("INSERT INTO employees(name,role,department,email,status) VALUES(?,?,?,?,?)").bind("Miguel Santos","Sales Executive","Sales","miguel@atlas.example","Active"),
    d.prepare("INSERT INTO employees(name,role,department,email,status) VALUES(?,?,?,?,?)").bind("Isabella Cruz","Purchasing Officer","Procurement","isabella@atlas.example","Active"),
    d.prepare("INSERT INTO employees(name,role,department,email,status) VALUES(?,?,?,?,?)").bind("Daniel Lim","Accountant","Finance","daniel@atlas.example","Active"),
    d.prepare("INSERT INTO expenses(description,category,amount_cents,incurred_at) VALUES(?,?,?,?)").bind("Office rent","Facilities",4250000,date),
    d.prepare("INSERT INTO expenses(description,category,amount_cents,incurred_at) VALUES(?,?,?,?)").bind("Internet and utilities","Utilities",875000,date),
    d.prepare("INSERT INTO expenses(description,category,amount_cents,incurred_at) VALUES(?,?,?,?)").bind("Delivery and logistics","Logistics",325000,date),
   ];
   await d.batch(statements);
   return Response.json({message:"Sample workspace loaded."});
  }
  if(body.action==="product"){
   const sku=str(body.sku,40),name=str(body.name),category=str(body.category,80),price=body.priceCents,cost=body.costCents,stock=body.stock,reorder=body.reorderLevel;
   if(!sku||!name||!category||!positive(price)||!nonnegative(cost)||!nonnegative(stock)||!nonnegative(reorder))return fail("Enter a SKU, name, category, valid prices, and stock levels.");
   const duplicate=await d.prepare("SELECT id FROM products WHERE sku=?").bind(sku).first();
   if(duplicate)return fail("That SKU is already in use.",409);
   await d.prepare("INSERT INTO products(sku,name,category,price_cents,cost_cents,stock,reorder_level,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(sku,name,category,price,cost,stock,reorder,date).run();
   return Response.json({message:"Product added."},{status:201});
  }
  if(body.action==="partner"){
   const kind=str(body.kind),name=str(body.name),email=str(body.email),phone=str(body.phone,60),city=str(body.city,80);
   if(!["customer","supplier"].includes(kind)||!name)return fail("Enter a name and valid contact type.");
   await d.prepare("INSERT INTO partners(kind,name,email,phone,city,created_at) VALUES(?,?,?,?,?,?)").bind(kind,name,email,phone,city,date).run();
   return Response.json({message:"Contact added."},{status:201});
  }
  if(body.action==="employee"){
   const name=str(body.name),role=str(body.role),department=str(body.department),email=str(body.email),status=str(body.status);
   if(!name||!role||!department||!["Active","On leave"].includes(status))return fail("Complete the required employee fields.");
   await d.prepare("INSERT INTO employees(name,role,department,email,status) VALUES(?,?,?,?,?)").bind(name,role,department,email,status).run();
   return Response.json({message:"Employee added."},{status:201});
  }
  if(body.action==="expense"){
   const description=str(body.description),category=str(body.category),amount=body.amountCents;
   if(!description||!category||!positive(amount))return fail("Enter an expense description, category, and amount.");
   await d.prepare("INSERT INTO expenses(description,category,amount_cents,incurred_at) VALUES(?,?,?,?)").bind(description,category,amount,date).run();
   return Response.json({message:"Expense recorded."},{status:201});
  }
  if(body.action==="order"){
   const kind=str(body.kind),partnerId=body.partnerId,raw=body.items;
   if(!["sales","purchase"].includes(kind)||!positive(partnerId)||!Array.isArray(raw)||raw.length===0||raw.length>30)return fail("Choose a contact and at least one order item.");
   const partner=await d.prepare("SELECT id FROM partners WHERE id=? AND kind=?").bind(partnerId,kind==="sales"?"customer":"supplier").first();
   if(!partner)return fail("Choose a valid contact for this order.");
   const items=raw as Item[];
   if(items.some(i=>!positive(i.productId)||!positive(i.quantity)||i.quantity>10000)||new Set(items.map(i=>i.productId)).size!==items.length)return fail("Order lines contain invalid or duplicate products.");
   const available=await d.prepare(`SELECT id,price_cents,cost_cents,stock FROM products WHERE id IN (${items.map(()=>"?").join(",")})`).bind(...items.map(i=>i.productId)).all<{id:number;price_cents:number;cost_cents:number;stock:number}>();
   if(available.results.length!==items.length)return fail("Some products are unavailable.");
   const lookup=new Map(available.results.map(p=>[p.id,p]));
   if(kind==="sales"&&items.some(i=>lookup.get(i.productId)!.stock<i.quantity))return fail("Insufficient stock for one or more products.");
   const id=crypto.randomUUID(),code=(kind==="sales"?"SO":"PO")+"-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,5).toUpperCase();
   const lines=items.map(i=>({productId:i.productId,quantity:i.quantity,unit:kind==="sales"?lookup.get(i.productId)!.price_cents:lookup.get(i.productId)!.cost_cents}));
   const total=lines.reduce((n,i)=>n+i.quantity*i.unit,0);
   await d.batch([
    d.prepare("INSERT INTO orders(id,code,kind,partner_id,status,total_cents,created_at) VALUES(?,?,?,?,?,?,?)").bind(id,code,kind,partnerId,"Draft",total,date),
    ...lines.map(i=>d.prepare("INSERT INTO order_lines(order_id,product_id,quantity,unit_cents) VALUES(?,?,?,?)").bind(id,i.productId,i.quantity,i.unit))
   ]);
   return Response.json({message:"Order created.",id},{status:201});
  }
  if(body.action==="complete"){
   const id=str(body.id,80);
   const order=await d.prepare("SELECT id,kind,status FROM orders WHERE id=?").bind(id).first<{id:string;kind:string;status:string}>();
   if(!order||order.status!=="Draft")return fail("Only a draft order can be completed.",409);
   const lines=await d.prepare("SELECT product_id,quantity FROM order_lines WHERE order_id=?").bind(id).all<{product_id:number;quantity:number}>();
   if(!lines.results.length)return fail("This order has no items.");
   const token=date+"-"+crypto.randomUUID();
   const updateOrder=order.kind==="sales"
    ?d.prepare("UPDATE orders SET status='Completed',completed_at=? WHERE id=? AND status='Draft' AND NOT EXISTS (SELECT 1 FROM order_lines l JOIN products p ON p.id=l.product_id WHERE l.order_id=? AND p.stock<l.quantity)").bind(token,id,id)
    :d.prepare("UPDATE orders SET status='Completed',completed_at=? WHERE id=? AND status='Draft'").bind(token,id);
   const direction=order.kind==="sales"?"-":"+";
   const result=await d.batch([
    updateOrder,
    ...lines.results.map(i=>d.prepare(`UPDATE products SET stock=stock${direction}? WHERE id=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND completed_at=?)`).bind(i.quantity,i.product_id,id,token))
   ]);
   if(!result[0].meta.changes)return fail("The order could not be completed. Check stock and try again.",409);
   return Response.json({message:order.kind==="sales"?"Sale completed and stock reduced.":"Purchase received and stock increased."});
  }
  return fail("Unknown action.");
 }catch(e){return safeError(e)}
}
