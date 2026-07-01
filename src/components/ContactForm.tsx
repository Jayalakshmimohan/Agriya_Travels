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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      <div className="rounded-2xl bg-theme-card p-8 sm:p-12 shadow-sm ring-1 ring-gray-200 text-center flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Enquiry Sent Successfully!</h3>
        <p className="text-gray-600 mb-8 max-w-md">
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
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 w-full sm:w-auto"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-theme-card p-6 sm:p-10 shadow-sm ring-1 ring-gray-200 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
          <input
            type="tel"
            name="phone"
            required
             value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Destination</label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
          <input
            type="date"
            name="travelDate"
            value={formData.travelDate}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travellers</label>
            <input
              type="number"
               name="travellers"
               min="1"
              value={formData.travellers}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
            <select
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">Select</option>
              <option>Economy</option>
              <option>Standard</option>
              <option>Premium</option>
              <option>Luxury</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message or Special Requests</label>
        <textarea
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        ></textarea>
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
