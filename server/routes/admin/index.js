const express = require('express');
const router = express.Router();

const courtRoutes = require('./courts');
const coachRoutes = require('./coaches');
const equipmentRoutes = require('./equipment');
const pricingRoutes = require('./pricing');

router.use('/courts', courtRoutes);
router.use('/coaches', coachRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/pricing', pricingRoutes);

module.exports = router;
