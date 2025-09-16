import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all system configuration
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const config = await req.prisma.systemConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }]
    });
    res.json(config);
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get config by key
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const config = await req.prisma.systemConfig.findUnique({
      where: { key: req.params.key }
    });
    
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Get config by key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update single config
router.put('/:key', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { value, category } = req.body;
    
    const config = await req.prisma.systemConfig.upsert({
      where: { key: req.params.key },
      update: { value, category },
      create: { 
        key: req.params.key, 
        value, 
        category: category || 'general' 
      }
    });
    
    res.json(config);
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update settings
router.post('/bulk-update', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { settings } = req.body;
    
    const updatePromises = settings.map((setting) => 
      req.prisma.systemConfig.upsert({
        where: { key: setting.key },
        update: { 
          value: setting.value, 
          category: setting.category 
        },
        create: { 
          key: setting.key, 
          value: setting.value, 
          category: setting.category 
        }
      })
    );
    
    await Promise.all(updatePromises);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Bulk update config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete config
router.delete('/:key', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    await req.prisma.systemConfig.delete({
      where: { key: req.params.key }
    });
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;