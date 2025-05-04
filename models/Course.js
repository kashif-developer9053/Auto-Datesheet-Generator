import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  complexity: {
    type: Number,
    default: 1 // 1-5 scale for exam difficulty/priority
  }
});

export default mongoose.models.Course || mongoose.model('Course', courseSchema); 