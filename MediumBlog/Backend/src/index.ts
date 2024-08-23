import { Hono } from 'hono'
import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'


const app = new Hono()

app.route('/api/user', userRouter)

app.route('/api/blog', blogRouter)

export default app

