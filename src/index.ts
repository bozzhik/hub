import {Elysia} from 'elysia'
import {hubRoute} from './routes/hub'
import {zeroRoute} from './routes/zero'

export default new Elysia().use(hubRoute).use(zeroRoute)
