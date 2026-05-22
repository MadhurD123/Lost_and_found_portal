import { Router, Response } from 'express';
import { DB } from './db.js';
import { requireAuth, AuthenticatedRequest } from './auth.js';
import { findMatchesForItem } from './ai.js';

const itemsRouter = Router();

// ==========================================
// A. LOST ITEMS ENDPOINTS
// ==========================================

/**
 * @route GET /api/lost
 * List lost items with support for search, category, and status filters
 */
itemsRouter.get('/lost', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter: any = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    let items = await DB.lostItems.find(filter);

    // Apply client-side text filtering if search is defined to support robust local Jaccard or query string lookup
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase();
      items = items.filter((item: any) => 
        item.itemName.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.locationLost.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q)
      );
    }

    res.json(items);
  } catch (err: any) {
    console.error('Error fetching university lost items list:', err);
    res.status(500).json({ message: 'Failed to fetch lost listings.' });
  }
});

/**
 * @route GET /api/lost/:id
 */
itemsRouter.get('/lost/:id', async (req, res) => {
  try {
    const item = await DB.lostItems.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Lost item listing could not be found.' });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Database query failure.' });
  }
});

/**
 * @route POST /api/lost
 */
itemsRouter.post('/lost', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemName, description, category, locationLost, dateLost, image, contactEmail } = req.body;

    if (!itemName || !description || !category || !locationLost || !dateLost || !contactEmail) {
      res.status(400).json({ message: 'Incomplete request context. Please fill out all required fields.' });
      return;
    }

    const newItem = await DB.lostItems.create({
      username: req.user!.username,
      userId: req.user!.userId,
      itemName: itemName.trim(),
      description: description.trim(),
      category,
      locationLost: locationLost.trim(),
      dateLost,
      image: image || '',
      contactEmail: contactEmail.trim().toLowerCase(),
      status: 'Searching'
    });

    res.status(201).json({
      message: 'Student reported lost item successfully created!',
      item: newItem
    });

  } catch (err: any) {
    console.error('Error reporting lost item:', err);
    res.status(500).json({ message: 'Database error while posting report.' });
  }
});

/**
 * @route PUT /api/lost/:id
 * Edit details or change status
 */
itemsRouter.put('/lost/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await DB.lostItems.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Item to edit not found.' });
      return;
    }

    // Authorize: Owner of listing or Admin
    if (item.userId !== req.user!.userId && !req.user!.isAdmin) {
      res.status(403).json({ message: 'Unauthorized. You do not own this listing.' });
      return;
    }

    const { itemName, description, category, locationLost, dateLost, image, contactEmail, status } = req.body;
    
    const updateData: any = {};
    if (itemName !== undefined) updateData.itemName = itemName.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (locationLost !== undefined) updateData.locationLost = locationLost.trim();
    if (dateLost !== undefined) updateData.dateLost = dateLost;
    if (image !== undefined) updateData.image = image;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail.trim().toLowerCase();
    if (status !== undefined) {
      if (!['Searching', 'Matched', 'Returned'].includes(status)) {
        res.status(400).json({ message: 'Invalid lost status payload.' });
        return;
      }
      updateData.status = status;
    }

    const updated = await DB.lostItems.findByIdAndUpdate(req.params.id, updateData);
    res.json({
      message: 'Listing successfully updated!',
      item: updated
    });

  } catch (err) {
    console.error('Error modifying lost item:', err);
    res.status(500).json({ message: 'Failed to update lost item listing.' });
  }
});

/**
 * @route DELETE /api/lost/:id
 */
itemsRouter.delete('/lost/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await DB.lostItems.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Item not found.' });
      return;
    }

    if (item.userId !== req.user!.userId && !req.user!.isAdmin) {
      res.status(403).json({ message: 'Unauthorized to delete this listing.' });
      return;
    }

    await DB.lostItems.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lost item listing successfully removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove listing.' });
  }
});


// ==========================================
// B. FOUND ITEMS ENDPOINTS
// ==========================================

/**
 * @route GET /api/found
 * List found items with support for search, category, and status filters
 */
itemsRouter.get('/found', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter: any = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    let items = await DB.foundItems.find(filter);

    // Filter text lookups in descriptions or title
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase();
      items = items.filter((item: any) => 
        item.itemName.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.locationFound.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q)
      );
    }

    res.json(items);
  } catch (err) {
    console.error('Error fetching university found items list:', err);
    res.status(500).json({ message: 'Failed to fetch found listings.' });
  }
});

/**
 * @route GET /api/found/:id
 */
itemsRouter.get('/found/:id', async (req, res) => {
  try {
    const item = await DB.foundItems.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Found item listing could not be found.' });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Database query failure.' });
  }
});

/**
 * @route POST /api/found
 */
itemsRouter.post('/found', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemName, description, category, locationFound, dateFound, image, contactEmail } = req.body;

    if (!itemName || !description || !category || !locationFound || !dateFound || !contactEmail) {
      res.status(400).json({ message: 'Incomplete content. Review all fields before submission.' });
      return;
    }

    const newItem = await DB.foundItems.create({
      username: req.user!.username,
      userId: req.user!.userId,
      itemName: itemName.trim(),
      description: description.trim(),
      category,
      locationFound: locationFound.trim(),
      dateFound,
      image: image || '',
      contactEmail: contactEmail.trim().toLowerCase(),
      status: 'Available'
    });

    res.status(201).json({
      message: 'Student reported found item successfully created!',
      item: newItem
    });

  } catch (err: any) {
    console.error('Error reporting found item:', err);
    res.status(500).json({ message: 'Database error saving reporting content.' });
  }
});

/**
 * @route PUT /api/found/:id
 */
itemsRouter.put('/found/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await DB.foundItems.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Found item not found.' });
      return;
    }

    if (item.userId !== req.user!.userId && !req.user!.isAdmin) {
      res.status(403).json({ message: 'Unauthorized. Ownership verification failed.' });
      return;
    }

    const { itemName, description, category, locationFound, dateFound, image, contactEmail, status } = req.body;
    
    const updateData: any = {};
    if (itemName !== undefined) updateData.itemName = itemName.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (locationFound !== undefined) updateData.locationFound = locationFound.trim();
    if (dateFound !== undefined) updateData.dateFound = dateFound;
    if (image !== undefined) updateData.image = image;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail.trim().toLowerCase();
    if (status !== undefined) {
      if (!['Available', 'Claimed', 'Returned'].includes(status)) {
        res.status(400).json({ message: 'Invalid found status payload.' });
        return;
      }
      updateData.status = status;
    }

    const updated = await DB.foundItems.findByIdAndUpdate(req.params.id, updateData);
    res.json({
      message: 'Listing updated successfully.',
      item: updated
    });
  } catch (err) {
    console.error('Error modifying found item:', err);
    res.status(500).json({ message: 'Failed to update found item listing.' });
  }
});

/**
 * @route DELETE /api/found/:id
 */
itemsRouter.delete('/found/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await DB.foundItems.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Found item not found.' });
      return;
    }

    if (item.userId !== req.user!.userId && !req.user!.isAdmin) {
      res.status(403).json({ message: 'Unauthorized to delete this found listing.' });
      return;
    }

    await DB.foundItems.findByIdAndDelete(req.params.id);
    res.json({ message: 'Found item listing successfully deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove listing.' });
  }
});

// ==========================================
// C. SEMANTIC AI MATCH FINDER
// ==========================================

/**
 * @route GET /api/match/:type/:id
 * Uses Gemini or Jaccard local comparator to scan counterpart lists for matches
 */
itemsRouter.get('/match/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    if (type !== 'lost' && type !== 'found') {
      res.status(400).json({ message: 'Invalid listing type requested for match scans.' });
      return;
    }

    let searchTarget: any = null;
    if (type === 'lost') {
      searchTarget = await DB.lostItems.findById(id);
    } else {
      searchTarget = await DB.foundItems.findById(id);
    }

    if (!searchTarget) {
      res.status(404).json({ message: 'Source item not found.' });
      return;
    }

    const recommendations = await findMatchesForItem({
      itemName: searchTarget.itemName,
      description: searchTarget.description,
      category: searchTarget.category,
      _id: searchTarget._id,
      type: type === 'lost' ? 'Lost' : 'Found'
    });

    res.json({
      targetId: id,
      type: searchTarget.type,
      itemName: searchTarget.itemName,
      matches: recommendations
    });

  } catch (err: any) {
    console.error('Error compiling match recommendations:', err);
    res.status(500).json({ message: 'Failed to find similarity matches. Please retry.' });
  }
});

export { itemsRouter };
