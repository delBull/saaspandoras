import express from "express";
import dotenv from "dotenv";
import { deployNFTPassServer, deployW2EProtocol, NetworkType, NFTPassConfig, W2EConfig } from "@pandoras/protocol-deployer";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEPLOY_SECRET = process.env.DEPLOY_SECRET;

if (!DEPLOY_SECRET) {
    throw new Error("DEPLOY_SECRET missing");
}

app.get("/health", (_, res) => {
    res.json({ status: "ok" });
});

app.post("/deploy/nft-pass", async (req, res) => {
    res.setTimeout(120_000); // 2 minutes timeout

    if (req.headers["x-deploy-secret"] !== DEPLOY_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { config, network } = req.body as {
            config: NFTPassConfig;
            network: NetworkType;
        };

        if (!config || !network) {
            return res.status(400).json({ error: "Invalid payload" });
        }

        const address = await deployNFTPassServer(config, network);
        return res.json({ success: true, address });
    } catch (err: any) {
        console.error("❌ Deploy failed:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Deployment failed"
        });
    }
});

app.post("/deploy/protocol", async (req, res) => {
    res.setTimeout(300_000); // 5 minutes timeout for 5 contracts

    if (req.headers["x-deploy-secret"] !== DEPLOY_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { slug, config, network } = req.body as {
            slug: string;
            config: W2EConfig;
            network: NetworkType;
        };

        if (!slug || !config || !network) {
            return res.status(400).json({ error: "Invalid payload for protocol deploy" });
        }

        const result = await deployW2EProtocol(slug, config, network);
        return res.json({ success: true, deployment: result });
    } catch (err: any) {
        console.error("❌ Protocol Deploy failed:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Protocol Deployment failed"
        });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Deployment Service running on port ${PORT}`);
});
