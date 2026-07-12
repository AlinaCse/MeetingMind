const router = require('express').Router(); const controller = require('../controllers/actionItemController'); const isLoggedIn = require('../middleware/isLoggedIn');
router.get('/actionItems', isLoggedIn, controller.index); router.put('/actionItems/:id/done', isLoggedIn, controller.markDone);
module.exports = router;
