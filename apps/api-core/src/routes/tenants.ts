import { Router, type Request, type Response } from 'express';
import { db } from '../lib/db.js';
import { tenants } from '../db/schema-extended.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /tenants - List all tenants
router.get('/', async (req: Request, res: Response) => {
    try {
        const allTenants = await db.query.tenants.findMany({
            orderBy: (tenants, { asc }) => [asc(tenants.createdAt)]
        });
        
        return res.status(200).json({
            success: true,
            tenants: allTenants
        });
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /tenants/:id - Get single tenant
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, id)
        });
        
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        return res.status(200).json({ success: true, tenant });
    } catch (error) {
        console.error('Error fetching tenant:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /tenants - Create new tenant
router.post('/', async (req: Request, res: Response) => {
    try {
        const { id, name, description, config, isActive = true } = req.body;
        
        if (!id || !name) {
            return res.status(400).json({ error: 'ID and name are required' });
        }
        
        // Check if tenant already exists
        const existing = await db.query.tenants.findFirst({
            where: eq(tenants.id, id)
        });
        
        if (existing) {
            return res.status(409).json({ error: 'Tenant already exists' });
        }
        
        const newTenant = await db.insert(tenants).values({
            id,
            name,
            description: description || null,
            config: config || {
                nftContracts: [],
                minTokenBalance: "0",
                requiredRoles: [],
                whitelistedAddresses: []
            },
            isActive
        }).returning();
        
        return res.status(201).json({
            success: true,
            tenant: newTenant[0]
        });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PATCH /tenants/:id - Update tenant
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, config, isActive } = req.body;
        
        const existing = await db.query.tenants.findFirst({
            where: eq(tenants.id, id)
        });
        
        if (!existing) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        const updated = await db.update(tenants)
            .set({
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(config && { config }),
                ...(isActive !== undefined && { isActive }),
                updatedAt: new Date()
            })
            .where(eq(tenants.id, id))
            .returning();
        
        return res.status(200).json({
            success: true,
            tenant: updated[0]
        });
    } catch (error) {
        console.error('Error updating tenant:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /tenants/:id - Delete tenant (soft delete - just set inactive)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const existing = await db.query.tenants.findFirst({
            where: eq(tenants.id, id)
        });
        
        if (!existing) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        // Soft delete - just set inactive
        await db.update(tenants)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(tenants.id, id));
        
        return res.status(200).json({
            success: true,
            message: 'Tenant deactivated'
        });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
