import React, { useState } from 'react';
import { Send, CheckCircle2, Phone } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';

export default function ContactForm({ focus = 'general' }: { focus?: 'general' | 'rentals' | 'corporate' }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    destination: '',
    travelDate: '',
    travellers: '',
    budget: '',
    message: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    destination: '',
    travelDate: '',
    travellers: '',
    message: '',
  });

  const validateField = (name: string, value: string) => {
    let error = '';
    
    if (name === 'name') {
      const trimmed = value.trim();
      if (!trimmed) {
        error = 'Full Name is required';
      } else if (!/^[a-zA-Z\s'-]{2,50}$/.test(trimmed)) {
        error = 'Name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)';
      }
    }
    
    if (name === 'phone') {
      const trimmed = value.trim();
      const digits = trimmed.replace(/\D/g, '');
      if (!trimmed) {
        error = 'Mobile Number is required';
      } else if (digits.length < 10 || digits.length > 15) {
        error = 'Mobile number must contain between 10 and 15 digits';
      } else if (!/^\+?[0-9\s\-()]+$/.test(trimmed)) {
        error = 'Invalid character in mobile number. Use only numbers, spaces, hyphens, parentheses, or +';
      }
    }
    
    if (name === 'email') {
      const trimmed = value.trim();
      if (trimmed && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        error = 'Please enter a valid email address';
      }
    }
    
    if (name === 'travellers') {
      if (value) {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 500) {
          error = 'Number of travellers must be between 1 and 500';
        }
      }
    }

    if (name === 'travelDate') {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          error = 'Travel date cannot be in the past';
        }
      }
    }

    if (name === 'destination') {
      const trimmed = value.trim();
      if (trimmed && trimmed.length > 100) {
        error = 'Destination must be less than 100 characters';
      } else if (trimmed && !/^[a-zA-Z0-9\s,.'()-]+$/.test(trimmed)) {
        error = 'Destination contains invalid characters';
      }
    }

    if (name === 'message') {
      const trimmed = value.trim();
      if (trimmed && trimmed.length > 1000) {
        error = 'Message must be less than 1000 characters';
      }
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateField('name', formData.name);
    const phoneErr = validateField('phone', formData.phone);
    const emailErr = validateField('email', formData.email);
    const travellersErr = validateField('travellers', formData.travellers);
    const travelDateErr = validateField('travelDate', formData.travelDate);
    const destErr = validateField('destination', formData.destination);
    const messageErr = validateField('message', formData.message);

    if (nameErr || phoneErr || emailErr || travellersErr || travelDateErr || destErr || messageErr) {
      const firstError = [
        { name: 'name', err: nameErr },
        { name: 'phone', err: phoneErr },
        { name: 'email', err: emailErr },
        { name: 'travellers', err: travellersErr },
        { name: 'travelDate', err: travelDateErr },
        { name: 'destination', err: destErr },
        { name: 'message', err: messageErr },
      ].find(item => item.err);

      if (firstError) {
        const element = document.getElementsByName(firstError.name)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLInputElement).focus();
        }
      }
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    if (name === 'phone') {
      value = value.replace(/[^0-9+\s\-()]/g, '');
    }

    if (name === 'name') {
      value = value.replace(/[^a-zA-Z\s'-]/g, '');
    }

    if (name === 'travellers') {
      value = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  if (isSuccess) {
    let messageText = `Hi Agriya Travels! I just submitted an enquiry on your website.\n\nName: ${formData.name}\nDestination: ${formData.destination}`;
    
    if (focus === 'rentals') {
      messageText = `Hi Agriya Travels, I need a vehicle (${formData.message || 'tempo traveller'}) from Chennai for an outstation trip. Please share availability and pricing.`;
    } else if (focus === 'corporate') {
      messageText = `Hi Agriya Travels, I am looking for corporate travel arrangements for ${formData.destination || 'our team'} from Chennai. Please share details.`;
    } else {
      messageText = `Hi Agriya Travels, I just submitted an enquiry on your website.\n\nName: ${formData.name}\nDestination: ${formData.destination}\nMessage: ${formData.message}`;
    }

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;

    return (
      <div className="rounded-2xl bg-theme-card p-8 sm:p-12 shadow-sm ring-1 ring-gray-200 dark:ring-theme-border/60 text-center flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-theme-heading mb-2">Enquiry Sent Successfully!</h3>
        <p className="text-theme-muted mb-8 max-w-md">
          Thank you for reaching out, {formData.name}. Our travel experts from Chennai will contact you shortly. Want a faster response?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
           <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 w-full sm:w-auto"
          >
            <Phone className="h-5 w-5" />
            Continue on WhatsApp
          </a>
          <button
            onClick={() => {
              setIsSuccess(false);
              setFormData({name: '', phone: '', email: '', destination: '', travelDate: '', travellers: '', budget: '', message: ''});
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-theme-border/80 px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-slate-200 transition hover:bg-gray-50 dark:hover:bg-theme-navy/40 w-full sm:w-auto"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-theme-card p-6 sm:p-10 shadow-sm ring-1 ring-gray-200 dark:ring-theme-border/60 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-lg border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
              errors.name 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-theme-border/80 focus:border-orange-500 focus:ring-orange-500/20'
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.name}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Mobile Number *</label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. +91 99419 38222"
            className={`w-full rounded-lg border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
              errors.phone 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-theme-border/80 focus:border-orange-500 focus:ring-orange-500/20'
            }`}
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.phone}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-lg border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
              errors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-theme-border/80 focus:border-orange-500 focus:ring-orange-500/20'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.email}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Preferred Destination</label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            className={`w-full rounded-lg border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
              errors.destination 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-theme-border/80 focus:border-orange-500 focus:ring-orange-500/20'
            }`}
          />
          {errors.destination && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.destination}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Travel Date</label>
          <input
            type="date"
            name="travelDate"
            value={formData.travelDate}
            onChange={handleChange}
            className={`w-full rounded-lg border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
              errors.travelDate 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-theme-border/80 focus:border-orange-500 focus:ring-orange-500/20'
            }`}
          />
          {errors.travelDate && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.travelDate}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Travellers</label>
            <input
              type="number"
              name="travellers"
              min="1"
              value={formData.travellers}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
                errors.travellers 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-gray-300 dark:border-theme-border/80 focus:border-orange-500 focus:ring-orange-500/20'
              }`}
            />
            {errors.travellers && (
              <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                <span>⚠️</span> {errors.travellers}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Budget</label>
            <select
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-theme-border/80 bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
            >
              <option value="" className="bg-white dark:bg-[#0B192C] text-gray-900 dark:text-white">Select</option>
              <option className="bg-white dark:bg-[#0B192C] text-gray-900 dark:text-white">Economy</option>
              <option className="bg-white dark:bg-[#0B192C] text-gray-900 dark:text-white">Standard</option>
              <option className="bg-white dark:bg-[#0B192C] text-gray-900 dark:text-white">Premium</option>
              <option className="bg-white dark:bg-[#0B192C] text-gray-900 dark:text-white">Luxury</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Message or Special Requests</label>
        <textarea
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className={`w-full rounded-lg border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
            errors.message 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-300 dark:border-theme-border/80 focus:border-orange-500 focus:ring-orange-500/20'
          }`}
        ></textarea>
        {errors.message && (
          <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
            <span>⚠️</span> {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-500 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : (
          <>
            <Send className="h-5 w-5" />
            Request Free Quote
          </>
        )}
      </button>
    </form>
  );
}
