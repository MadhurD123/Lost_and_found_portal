import { Router, Response } from 'express';
import { DB } from './db.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth.js';

const claimsRouter = Router();

/**
 * @route POST /api/claims
 * Submit claim or contact admin for lost/found item
 */
claimsRouter.post('/claims', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, itemType, message } = req.body;

    if (!itemId || !itemType || !message) {
      res.status(400).json({ message: 'Item identity, type, and detailed claim message are required.' });
      return;
    }

    if (!['Lost', 'Found'].includes(itemType)) {
      res.status(400).json({ message: 'Invalid item type specified.' });
      return;
    }

    // Lookup original item details to cache item name and target owner in claim schema
    let originalItem: any = null;
    if (itemType === 'Lost') {
      originalItem = await DB.lostItems.findById(itemId);
    } else {
      originalItem = await DB.foundItems.findById(itemId);
    }

    if (!originalItem) {
      res.status(404).json({ message: 'The referenced listing does not exist.' });
      return;
    }

    // Handle check if user tries to claim their own item
    if (originalItem.userId === req.user!.userId) {
      res.status(400).json({ message: 'You cannot file a claim review request for your own listing.' });
      return;
    }

    // Check pre-existing duplicate claim request by this user
    const existingClaim = await DB.claimRequests.find({
      itemId,
      claimantUsername: req.user!.username,
      requestStatus: 'Pending'
    });
    if (existingClaim && existingClaim.length > 0) {
      res.status(400).json({ message: 'You already have an active pending claim for this item.' });
      return;
    }

    const claim = await DB.claimRequests.create({
      itemId,
      itemType,
      claimantUsername: req.user!.username,
      claimantEmail: req.user!.email,
      message: message.trim(),
      requestStatus: 'Pending',
      itemName: originalItem.itemName,
      itemPoster: originalItem.username
    });

    res.status(201).json({
      message: 'Claim request successfully submitted to administrator review!',
      claim
    });

  } catch (err) {
    console.error('Error submitting claim:', err);
    res.status(500).json({ message: 'Database database exception while filing claims.' });
  }
});

/**
 * @route GET /api/claims
 * Students see their submissions; Admin sees everything
 */
claimsRouter.get('/claims', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let claims;
    if (req.user!.isAdmin) {
      claims = await DB.claimRequests.find();
    } else {
      claims = await DB.claimRequests.find({ claimantUsername: req.user!.username });
    }
    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: 'Exception querying database records.' });
  }
});

/**
 * @route PUT /api/claims/:id
 * Admin approves or rejects the claim request.
 * Automatically updates item status if approved.
 */
claimsRouter.put('/claims/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestStatus } = req.body;
    if (!['Approved', 'Rejected'].includes(requestStatus)) {
      res.status(400).json({ message: 'Status must be Approved or Rejected.' });
      return;
    }

    const claim = await DB.claimRequests.findById(req.params.id);
    if (!claim) {
      res.status(404).json({ message: 'Claim request not found.' });
      return;
    }

    const updatedClaim = await DB.claimRequests.findByIdAndUpdate(req.params.id, {
      requestStatus
    });

    if (requestStatus === 'Approved') {
      // Cascade update state: mark item as Returned when approved
      if (claim.itemType === 'Lost') {
        await DB.lostItems.findByIdAndUpdate(claim.itemId, { status: 'Returned' });
      } else {
        await DB.foundItems.findByIdAndUpdate(claim.itemId, { status: 'Returned' });
      }
    }

    res.json({
      message: `Claim request has been successfully ${requestStatus.toLowerCase()}!`,
      claim: updatedClaim
    });

  } catch (err) {
    console.error('Error updating claim request:', err);
    res.status(500).json({ message: 'Failed to update claim state.' });
  }
});

/**
 * @route DELETE /api/claims/:id
 * Cancel/remove request (owner or admin)
 */
claimsRouter.delete('/claims/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const claim = await DB.claimRequests.findById(req.params.id);
    if (!claim) {
      res.status(404).json({ message: 'Claim request not found.' });
      return;
    }

    if (claim.claimantUsername !== req.user!.username && !req.user!.isAdmin) {
      res.status(403).json({ message: 'Unauthorized. You did not submit this claim.' });
      return;
    }

    await DB.claimRequests.findByIdAndDelete(req.params.id);
    res.json({ message: 'Claim request successfully cancelled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete claim.' });
  }
});

/**
 * @route GET /api/admin/stats
 * Compares listings ratios, totals, and logs for charts/metrics display
 */
claimsRouter.get('/admin/stats', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lostList = await DB.lostItems.find();
    const foundList = await DB.foundItems.find();
    const claimsList = await DB.claimRequests.find();

    const stats = {
      counts: {
        lost: lostList.length,
        found: foundList.length,
        claims: claimsList.length
      },
      lostStatus: {
        Searching: lostList.filter((i: any) => i.status === 'Searching').length,
        Matched: lostList.filter((i: any) => i.status === 'Matched').length,
        Returned: lostList.filter((i: any) => i.status === 'Returned').length,
      },
      foundStatus: {
        Available: foundList.filter((i: any) => i.status === 'Available').length,
        Claimed: foundList.filter((i: any) => i.status === 'Claimed').length,
        Returned: foundList.filter((i: any) => i.status === 'Returned').length,
      },
      claimRequests: {
        Pending: claimsList.filter((i: any) => i.requestStatus === 'Pending').length,
        Approved: claimsList.filter((i: any) => i.requestStatus === 'Approved').length,
        Rejected: claimsList.filter((i: any) => i.requestStatus === 'Rejected').length,
      },
      categoryDistribution: {} as Record<string, number>
    };

    // Calculate category listings dispersion ratios
    const countCategory = (item: any) => {
      const cat = item.category || 'Others';
      stats.categoryDistribution[cat] = (stats.categoryDistribution[cat] || 0) + 1;
    };

    lostList.forEach(countCategory);
    foundList.forEach(countCategory);

    res.json(stats);

  } catch (err) {
    console.error('Error generating diagnostic dashboard metrics:', err);
    res.status(500).json({ message: 'Admin report creation failed.' });
  }
});

export { claimsRouter };
