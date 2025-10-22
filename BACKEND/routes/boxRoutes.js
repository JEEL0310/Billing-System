// const express = require('express');
// const router = express.Router();
// const {
//   createBox,
//   getBoxes,
//   getBoxById,
//   updateBox,
//   deleteBox,
//   getAvailableBoxes,
// } = require('../controllers/boxController');
// const { protect, isAdmin} = require('../middleware/authMiddleware');

// router.use(protect);
// router.use(isAdmin);

// router.route('/')
//   .post(createBox) 
//     .get(getBoxes); 

// router.route('/available')
//   .get(getAvailableBoxes); 

// router.route('/:id')
//   .get(getBoxById) 
//     .put(updateBox)
//     .delete(deleteBox); 



// module.exports = router;


const express = require('express');
const router = express.Router();
const {
  createBox,
  getBoxes,
  getBoxById,
  updateBox,
  deleteBox,
  getAvailableBoxes,
  generateBoxesPDF
} = require('../controllers/boxController');
const { protect, isAdmin} = require('../middleware/authMiddleware');

router.use(protect);
router.use(isAdmin);

router.route('/')
  .post(createBox) 
    .get(getBoxes); 

router.route('/available')
  .get(getAvailableBoxes); 

router.route('/generate-pdf')
  .post(generateBoxesPDF);

router.route('/:id')
  .get(getBoxById) 
    .put(updateBox)
    .delete(deleteBox); 



module.exports = router;