import {integer,sqliteTable,text,index,uniqueIndex} from "drizzle-orm/sqlite-core";
export const products=sqliteTable("products",{
 id:integer("id").primaryKey({autoIncrement:true}),
 sku:text("sku").notNull(),name:text("name").notNull(),category:text("category").notNull(),
 priceCents:integer("price_cents").notNull(),costCents:integer("cost_cents").notNull(),
 stock:integer("stock").notNull().default(0),reorderLevel:integer("reorder_level").notNull().default(10),
 createdAt:text("created_at").notNull().default(""),
},t=>[uniqueIndex("idx_products_sku").on(t.sku)]);
export const partners=sqliteTable("partners",{
 id:integer("id").primaryKey({autoIncrement:true}),kind:text("kind").notNull(),
 name:text("name").notNull(),email:text("email").notNull().default(""),phone:text("phone").notNull().default(""),
 city:text("city").notNull().default(""),createdAt:text("created_at").notNull().default(""),
},t=>[index("idx_partners_kind").on(t.kind)]);
export const orders=sqliteTable("orders",{
 id:text("id").primaryKey(),code:text("code").notNull(),kind:text("kind").notNull(),
 partnerId:integer("partner_id").notNull().references(()=>partners.id),
 status:text("status").notNull().default("Draft"),totalCents:integer("total_cents").notNull(),
 createdAt:text("created_at").notNull().default(""),completedAt:text("completed_at"),
},t=>[uniqueIndex("idx_orders_code").on(t.code),index("idx_orders_kind_created").on(t.kind,t.createdAt)]);
export const orderLines=sqliteTable("order_lines",{
 id:integer("id").primaryKey({autoIncrement:true}),orderId:text("order_id").notNull().references(()=>orders.id),
 productId:integer("product_id").notNull().references(()=>products.id),
 quantity:integer("quantity").notNull(),unitCents:integer("unit_cents").notNull(),
},t=>[index("idx_order_lines_order").on(t.orderId)]);
export const expenses=sqliteTable("expenses",{
 id:integer("id").primaryKey({autoIncrement:true}),description:text("description").notNull(),
 category:text("category").notNull(),amountCents:integer("amount_cents").notNull(),
 incurredAt:text("incurred_at").notNull(),
},t=>[index("idx_expenses_incurred").on(t.incurredAt)]);
export const employees=sqliteTable("employees",{
 id:integer("id").primaryKey({autoIncrement:true}),name:text("name").notNull(),
 role:text("role").notNull(),department:text("department").notNull(),
 email:text("email").notNull().default(""),status:text("status").notNull().default("Active"),
},t=>[index("idx_employees_department").on(t.department)]);
