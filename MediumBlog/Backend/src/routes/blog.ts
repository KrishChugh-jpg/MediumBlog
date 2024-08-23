import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
      }, 
      Variables:{
        userID: string
      }
}>()

// middleware - 1 user has acess , loggedIn otherwise block the req.
// 2 - if they are loggedIn then get the userID and pass it to all blog router handlers
blogRouter.use('/*', async (c, next) => {  

    const authHeader = c.req.header('authorization') 

   const user = await verify(authHeader || "", c.env.JWT_SECRET)

   if(user){
    c.set('userID', user.id as string)      
    await next()
   } else{
    return c.json({
    message: "You are not loggedIn"
    })
   }
})

blogRouter.post('/', async (c) =>{

    const body = await c.req.json()  
    const authorID = await c.get("userID")

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,  
      }).$extends(withAccelerate())

     const blog = await prisma.blog.create({
            data: {
                title: body.title,
                content: body.content,
                autherID: Number(authorID),
                Thumbnail: body.Thumbnail
// the middleware will take the token from the user and extract the userid from it 
//and pass the middleware to this route handler
            }
 })
      return c.json({
        id: blog.id
      })
  })
  
blogRouter.put('/', async (c) =>{ 

    const body = await c.req.json()  
    
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,  
      }).$extends(withAccelerate())

     const blog = await prisma.blog.update({
        where: {
            id: body.id
        },
            data: {
                title: body.title,
                content: body.content,
            }
 })
      return c.json({
        id: blog.id
      })
  })
  
blogRouter.get('/:id', async (c) =>{

    const body = await c.req.json()   
    
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,  
      }).$extends(withAccelerate())

      try{
     const blog = await prisma.blog.findFirst( {
         where:{
            id: body.id
         },
 })
      return c.json({
        id: body.id
      }) 
    }catch(e){
        c.status(411)
        return c.json({
        message: "Error while fetching blog post"
        })
      }
  })
  
//add pagination ie return first 10 blogs to user 
blogRouter.get('/bulk', async (c) =>{

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,  
        }).$extends(withAccelerate())

   const blogs = prisma.blog.findMany()

   return c.json({
    blogs
   })
  })