import mongoose from 'mongoose';

const datesheetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    examPeriod: {
        type: String,
        enum: ['Mid', 'Final'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    departmentSchedules: [{
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true
        },
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Batch',
            required: true
        },
        semester: {
            type: String,
            required: true
        },
        timeSlots: [{
            type: String,
            required: true
        }]
    }]
}, {
    timestamps: true
});

const Datesheet = mongoose.models.Datesheet || mongoose.model('Datesheet', datesheetSchema);

export default Datesheet; 