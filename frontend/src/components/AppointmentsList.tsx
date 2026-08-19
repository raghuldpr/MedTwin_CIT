import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Video, Plus, CheckCircle2, User, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

export const AppointmentsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');

  const appointments = [
    {
      id: 'apt-1',
      doctor: 'Dr. Sarah Mitchell, MD',
      specialty: 'Cardiologist',
      clinic: 'Cardiology & Vascular Institute',
      date: 'Tomorrow, Aug 19, 2026',
      time: '10:30 AM (45 min)',
      type: 'In-Person',
      location: 'Suite 402, Building A',
      status: 'Confirmed',
      reason: 'Bi-annual Digital Twin cardiovascular sync and ECG review',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'apt-2',
      doctor: 'Dr. Kevin Vance, MD',
      specialty: 'Endocrinology',
      clinic: 'Metabolic Health Center',
      date: 'Monday, Aug 25, 2026',
      time: '02:00 PM (30 min)',
      type: 'Telehealth Video',
      location: 'MedTwin Secure Telehealth Portal',
      status: 'Scheduled',
      reason: 'Continuous glucose monitoring & insulin sensitivity audit',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Appointments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Clinical consultations, telehealth visits, and lab checkups</p>
        </div>

        <button
          onClick={() => alert('Opening clinic scheduling calendar...')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer hover:scale-102 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200/80 pb-3">
        {(['Upcoming', 'Past'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center overflow-hidden ring-2 ring-slate-100 shrink-0">
                  {apt.avatar ? (
                    <img
                      src={apt.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span>{apt.doctor.replace('Dr. ', '').split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{apt.doctor}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold">
                      {apt.specialty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{apt.clinic}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {apt.status}
                </span>
              </div>
            </div>

            {/* Time & Location Pill details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{apt.date} • {apt.time}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                {apt.type.includes('Video') ? (
                  <Video className="w-4 h-4 text-purple-500 shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{apt.location}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Reason: </span>
              {apt.reason}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-50">
              <button
                onClick={() => alert(`Rescheduling appointment with ${apt.doctor}`)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reschedule
              </button>
              {apt.type.includes('Video') ? (
                <button
                  onClick={() => alert(`Joining secure telehealth room for ${apt.doctor}`)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Video Call</span>
                </button>
              ) : (
                <button
                  onClick={() => alert(`Checking in for appointment with ${apt.doctor}`)}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  Check In
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
