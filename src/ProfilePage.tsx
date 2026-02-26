import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Phone, 
  Camera, 
  Save, 
  ArrowLeft,
  Edit3,
  Info
} from 'lucide-react';
import { cn } from './lib/utils';

interface User {
  email: string;
  name: string;
  profilePic?: string;
  bio?: string;
  address?: string;
  phone?: string;
}

interface ProfilePageProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>({ ...user });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-8 font-bold"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Profile Header Background */}
        <div className="h-48 bg-gradient-to-r from-emerald-600 to-blue-600 relative">
          <div className="absolute -bottom-16 left-12">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl">
                {formData.profilePic ? (
                  <img 
                    src={formData.profilePic} 
                    alt={formData.name} 
                    className="w-full h-full rounded-[1.25rem] object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[1.25rem] bg-slate-100 flex items-center justify-center text-slate-400">
                    <UserIcon size={48} />
                  </div>
                )}
              </div>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-all"
                >
                  <Camera size={20} />
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
          
          <div className="absolute bottom-4 right-8">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/30 transition-all border border-white/30"
              >
                <Edit3 size={18} /> Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-lg"
              >
                <Save size={18} /> Save Changes
              </button>
            )}
          </div>
        </div>

        <div className="pt-20 pb-12 px-12">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-800"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-slate-400 font-bold cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-800"
                    placeholder="+880 1XXX XXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Address</label>
                  <input 
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-800"
                    placeholder="Your address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Bio / About You</label>
                  <textarea 
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-800 min-h-[140px] resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-1 space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">{user.name}</h2>
                  <p className="text-slate-500 font-medium">{user.email}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="font-bold text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="font-bold text-sm">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                      <p className="font-bold text-sm">{user.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-8">
                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Info size={20} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">About Me</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {user.bio || "No bio added yet. Click 'Edit Profile' to add some details about yourself!"}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                    <p className="text-emerald-600 font-black text-3xl mb-1">12</p>
                    <p className="text-emerald-800/60 text-xs font-black uppercase tracking-widest">Quizzes Taken</p>
                  </div>
                  <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                    <p className="text-blue-600 font-black text-3xl mb-1">45</p>
                    <p className="text-blue-800/60 text-xs font-black uppercase tracking-widest">Concepts Learned</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
