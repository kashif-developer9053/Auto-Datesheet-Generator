import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  batches: [{
    name: String,
    totalStudents: Number,
  }],
}, {
  timestamps: true
});

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department; 