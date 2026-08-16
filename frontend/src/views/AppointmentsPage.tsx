import React, { useState } from 'react';
import { mockAppointments } from '../data/mockData';
import { Appointment } from '../types';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Cancelled'>('Upcoming');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Priya Sharma');
  const [apptDate, setApptDate] = useState('2024-06-15');
  const [apptTime, setApptTime] = useState('11:00 AM');
  const [apptType, setApptType] = useState<'Video Consultation' | 'In-Person'>('Video Consultation');

  const filteredAppts = appointments.filter((a) =>
    activeTab === 'Upcoming'
      ? a.status === 'Upcoming'
      : activeTab === 'Past'
      ? a.status === 'Completed'
      : a.status === 'Cancelled'
  );

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt: Appointment = {
      id: `apt-${Date.now()}`,
      doctorName,
      specialty: 'Cardiology Specialist',
      hospital: 'MedTwin Virtual Clinic',
      date: apptDate,
      time: apptTime,
      type: apptType,
      status: 'Upcoming',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      meetingLink: 'https://meet.medtwin.health/room-consult-new',
    };
    setAppointments([newAppt, ...appointments]);
    setIsBookModalOpen(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Appointments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule consultations, review upcoming virtual visits, and sync with your doctors
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
          Book Appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 my-6 border-b border-slate-100 pb-3">
        {(['Upcoming', 'Past', 'Cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="flex flex-col gap-4">
        {filteredAppts.map((appt) => (
          <div
            key={appt.id}
            className="group bg-white rounded-3xl p-5 md:p-6 border border-slate-100/90 shadow-2xs hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col sm:flex-row sm:items-center justify-between gap-5"
          >
            <div className="flex items-start sm:items-center gap-4">
              <img
                src={appt.avatar}
                alt={appt.doctorName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">{appt.doctorName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{appt.specialty}</p>
                <p className="text-xs text-slate-400 mt-0.5">{appt.hospital}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                    {appt.date}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                    {appt.time}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-500">
                    <span className="material-symbols-outlined text-[16px] text-blue-500">
                      {appt.type === 'Video Consultation' ? 'videocam' : 'location_on'}
                    </span>
                    {appt.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
              {appt.status === 'Upcoming' && appt.meetingLink && (
                <button
                  onClick={() => alert(`Connecting to secure encrypted telehealth consultation with ${appt.doctorName}...`)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  Join Consultation
                </button>
              )}
              <button
                onClick={() => alert(`Appointment details for ${appt.doctorName}`)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all active:scale-95"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Book Doctor Consultation</h2>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="flex flex-col gap-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Physician</label>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs bg-white"
                >
                  <option>Dr. Priya Sharma (Cardiologist)</option>
                  <option>Dr. Rajesh Patel (Endocrinologist)</option>
                  <option>Dr. Ananya Rao (Physician)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApptType('Video Consultation')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      apptType === 'Video Consultation'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">videocam</span>
                    Video Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setApptType('In-Person')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      apptType === 'In-Person'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    In-Person
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
