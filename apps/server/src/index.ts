import { deserialize, init as initEdDSAPCD, verify } from "@pcd/eddsa-pcd"
import cors from "cors"
import dotenv from "dotenv"
import express, { Express, Request, Response } from "express"

dotenv.config({ path: `${process.cwd()}/../../.env` })

// The PCD package must be initialized before using its methods.
await initEdDSAPCD()

const app: Express = express()
const port = process.env.SERVER_PORT || 3000

// Middlewares.
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.get("/", (_req: Request, res: Response) => {
    res.send("Express + TypeScript Server")
})

// Store a color on a NodeJS environment variable.
app.post("/color", async (req: Request, res: Response) => {
    try {
        if (!req.body.pcd) {
            console.error(`[ERROR] No PCD specified`)

            res.status(400).send()
            return
        }

        const pcd = await deserialize(req.body.pcd)

        if (!(await verify(pcd))) {
            console.error(`[ERROR] PCD is not valid`)

            res.status(401).send()
            return
        }

        // Set the color on NodeJS `COLOR` environment variable.
        process.env.COLOR = `#${pcd.claim.message[0].toString(16)}`

        console.debug(`[OKAY] color has been set to ${process.env.COLOR}`)

        res.json({ color: process.env.COLOR }).status(200).send()
    } catch (error: any) {
        console.error(`[ERROR] ${error}`)

        res.send(500)
    }
})

// Get the color stored on the NodeJS environment variable.
app.get("/color", (_req: Request, res: Response) => {
    try {
        if (!process.env.COLOR) {
            console.error(`[ERROR] No color has been stored yet`)

            res.status(404).send()
            return
        }

        console.debug(`[OKAY] color ${process.env.COLOR} has been successfully sent`)

        res.json({ color: process.env.COLOR }).status(200)
    } catch (error: any) {
        console.error(`[ERROR] ${error}`)

        res.send(500)
    }
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
