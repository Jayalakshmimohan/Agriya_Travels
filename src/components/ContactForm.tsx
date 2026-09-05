import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Phone, Mail, Car, MapPin, Calendar, Users, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { WHATSAPP_NUMBER, CAB_BOOKING_EMAIL, TOUR_ENQUIRY_EMAIL, TOUR_ENQUIRY_CC_EMAIL } from '../data';
import { recordLead } from '../lib/leads';

interface ContactFormProps {
  focus?: 'general' | 'rentals' | 'corporate';
  selectedVehicle?: string;
  onSelectVehicle?: (v: string) => void;
}

export default function ContactForm({ focus = 'general', selectedVehicle, onSelectVehicle }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pickupLocation: '',
    destination: '',
    travelDate: '',
    pickupTime: 'Morning (06:00 AM - 12:00 PM)',
    vehicleType: 'Sedan (Dzire / Etios - 4 Seater)',
    tripType: 'Outstation Round Trip',
    travellers: focus === 'rentals' ? '4' : '2',
    budget: '',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync vehicle type if prop changes from outside (e.g. fleet card click)
  useEffect(() => {
    if (selectedVehicle) {
      setFormData(prev => ({ ...prev, vehicleType: selectedVehicle }));
    }
  }, [selectedVehicle]);

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
    
    if (name === 'pickupLocation' && focus === 'rentals') {
      const trimmed = value.trim();
      if (!trimmed) {
        error = 'Pickup location is required';
      } else if (trimmed.length > 120) {
        error = 'Pickup location must be less than 120 characters';
      }
    }

    if (name === 'destination') {
      const trimmed = value.trim();
      if (focus === 'rentals' && !trimmed) {
        error = 'Drop location / destination is required';
      } else if (trimmed && trimmed.length > 120) {
        error = 'Destination must be less than 120 characters';
      } else if (trimmed && !/^[a-zA-Z0-9\s,.'()/-]+$/.test(trimmed)) {
        error = 'Destination contains invalid characters';
      }
    }

    if (name === 'travelDate') {
      if (focus === 'rentals' && !value) {
        error = 'Travel / pickup date is required';
      } else if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          error = 'Travel date cannot be in the past';
        }
      }
    }

    if (name === 'travellers') {
      if (value) {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 500) {
          error = 'Number of passengers must be between 1 and 500';
        }
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

  const getStructuredEmail = (data: typeof formData) => {
    const isRentals = focus === 'rentals';
    const recipient = isRentals ? CAB_BOOKING_EMAIL : TOUR_ENQUIRY_EMAIL;
    const ccRecipient = isRentals ? '' : TOUR_ENQUIRY_CC_EMAIL;
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'Asia/Kolkata'
    });

    let subject = '';
    let body = '';

    if (isRentals) {
      subject = `Car & Vehicle Rental Booking Request - ${data.name} (${data.vehicleType})`;
      body = `=====================================================
🚗 AGRIYA TRAVELS - CAR & VEHICLE RENTAL ENQUIRY
=====================================================

CUSTOMER INFORMATION:
• Full Name: ${data.name}
• Mobile Number: ${data.phone}
• Email Address: ${data.email || 'Not Provided'}

TRIP & VEHICLE DETAILS:
• Vehicle Preference: ${data.vehicleType}
• Trip Type: ${data.tripType}
• Pickup Location: ${data.pickupLocation || 'Chennai'}
• Drop / Destination: ${data.destination}
• Pickup / Travel Date: ${data.travelDate || 'As per availability'}
• Preferred Pickup Time: ${data.pickupTime || 'Flexible'}
• Number of Passengers: ${data.travellers || 'Not Specified'}

SPECIAL REQUIREMENTS / ITINERARY NOTES:
${data.message.trim() || 'No additional special requests provided.'}

=====================================================
Sent from Agriya Travels Car & Vehicle Rentals Portal
Timestamp: ${formattedTimestamp} (IST)
=====================================================`;
    } else {
      subject = `Travel & Tour Enquiry - ${data.name} (${data.destination || 'General Enquiry'})`;
      body = `=====================================================
✈️ AGRIYA TRAVELS - TOUR & TRAVEL ENQUIRY
=====================================================

CUSTOMER INFORMATION:
• Full Name: ${data.name}
• Mobile Number: ${data.phone}
• Email Address: ${data.email || 'Not Provided'}

TRIP PREFERENCES:
• Preferred Destination: ${data.destination || 'General enquiry'}
• Planned Travel Date: ${data.travelDate || 'Flexible / To be planned'}
• Number of Travellers: ${data.travellers || 'Not Specified'}
• Budget Category: ${data.budget || 'Standard'}

MESSAGE / SPECIAL REQUESTS:
${data.message.trim() || 'No additional message provided.'}

=====================================================
Sent from Agriya Travels Contact Portal
Timestamp: ${formattedTimestamp} (IST)
=====================================================`;
    }

    const ccParam = ccRecipient ? `&cc=${encodeURIComponent(ccRecipient)}` : '';
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}${ccParam}&body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}`;
    return { recipient, ccRecipient, subject, body, mailtoUrl };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateField('name', formData.name);
    const phoneErr = validateField('phone', formData.phone);
    const emailErr = validateField('email', formData.email);
    const pickupErr = focus === 'rentals' ? validateField('pickupLocation', formData.pickupLocation) : '';
    const destErr = validateField('destination', formData.destination);
    const travelDateErr = validateField('travelDate', formData.travelDate);
    const travellersErr = validateField('travellers', formData.travellers);
    const messageErr = validateField('message', formData.message);

    if (nameErr || phoneErr || emailErr || pickupErr || destErr || travelDateErr || travellersErr || messageErr) {
      const firstError = [
        { name: 'name', err: nameErr },
        { name: 'phone', err: phoneErr },
        { name: 'email', err: emailErr },
        { name: 'pickupLocation', err: pickupErr },
        { name: 'destination', err: destErr },
        { name: 'travelDate', err: travelDateErr },
        { name: 'travellers', err: travellersErr },
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

    const emailData = getStructuredEmail(formData);

    // Save snapshot for success confirmation display
    setSubmittedData({
      ...formData,
      emailMeta: emailData
    });

    // Record the enquiry before handing off. Fire-and-forget by design —
    // awaiting here would get the mailto below blocked by the browser.
    recordLead({
      source: 'contact_form',
      focus,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      destination: formData.destination,
      travelDate: formData.travelDate,
      travellers: formData.travellers,
      budget: formData.budget,
      vehicleType: focus === 'rentals' ? formData.vehicleType : undefined,
      tripType: focus === 'rentals' ? formData.tripType : undefined,
      pickupLocation: focus === 'rentals' ? formData.pickupLocation : undefined,
      pickupTime: focus === 'rentals' ? formData.pickupTime : undefined,
      message: formData.message,
    });

    // Launch default system mail client immediately in the user-event thread
    try {
      window.location.href = emailData.mailtoUrl;
    } catch {
      const mailLink = document.createElement('a');
      mailLink.href = emailData.mailtoUrl;
      document.body.appendChild(mailLink);
      mailLink.click();
      document.body.removeChild(mailLink);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
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

    if (name === 'vehicleType' && onSelectVehicle) {
      onSelectVehicle(value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const isRentals = focus === 'rentals';

  if (isSuccess && submittedData) {
    let whatsappText = `Hi Agriya Travels! I just submitted a booking request on your website.\n\nName: ${submittedData.name}\nPhone: ${submittedData.phone}`;

    if (isRentals) {
      whatsappText = `Hi Agriya Travels, I would like to book a vehicle for rental.\n\n*Customer:* ${submittedData.name}\n*Vehicle:* ${submittedData.vehicleType}\n*Trip:* ${submittedData.tripType}\n*Pickup:* ${submittedData.pickupLocation}\n*Destination:* ${submittedData.destination}\n*Date:* ${submittedData.travelDate}\n*Pax:* ${submittedData.travellers}\n\nPlease confirm availability and rate quote.`;
    } else {
      whatsappText = `Hi Agriya Travels, I submitted an enquiry on your website.\n\n*Name:* ${submittedData.name}\n*Destination:* ${submittedData.destination || 'General Enquiry'}\n*Date:* ${submittedData.travelDate || 'Flexible'}\n*Travellers:* ${submittedData.travellers || 'Not Specified'}\n*Message:* ${submittedData.message || 'None'}`;
    }

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    return (
      <div className="rounded-3xl bg-theme-card p-6 sm:p-10 shadow-xl border border-theme-border/80 text-center flex flex-col items-center animate-fadeIn">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20 shadow-inner">
          <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
        </div>
        
        <h3 className="text-2xl font-bold font-serif text-theme-heading mb-2">
          {isRentals ? 'Car Rental Request Structured!' : 'Tour Enquiry Request Structured!'}
        </h3>
        
        <p className="text-sm text-theme-muted mb-6 max-w-lg font-light leading-relaxed">
          {isRentals ? (
            <>
              Your booking details have been collected and your system's default mail service was opened to send to <strong className="text-theme-gold font-semibold">{CAB_BOOKING_EMAIL}</strong>.
            </>
          ) : (
            <>
              Your tour enquiry details have been collected and your system's default mail service was opened to send to <strong className="text-theme-gold font-semibold">{TOUR_ENQUIRY_EMAIL}</strong> (CC: <strong className="text-theme-gold font-semibold">{TOUR_ENQUIRY_CC_EMAIL}</strong>).
            </>
          )}
        </p>

        {/* Structured Booking Summary Card */}
        <div className="w-full max-w-xl bg-theme-navy/5 dark:bg-[#0B192C]/70 rounded-2xl p-5 border border-theme-border text-left mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-theme-border pb-3 mb-3 gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-theme-heading flex items-center gap-2">
              {isRentals ? <Car className="h-4 w-4 text-theme-gold" /> : <Mail className="h-4 w-4 text-theme-gold" />}
              {isRentals ? 'Cab Booking Summary' : 'Tour Enquiry Summary'}
            </span>
            <span className="text-[10px] text-theme-gold font-bold px-2.5 py-1 bg-theme-gold/10 rounded-full border border-theme-gold/30 self-start sm:self-auto">
              {isRentals ? `Sent to ${CAB_BOOKING_EMAIL}` : `To: ${TOUR_ENQUIRY_EMAIL} | CC: ${TOUR_ENQUIRY_CC_EMAIL}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-theme-muted font-light">Customer Name</p>
              <p className="font-semibold text-theme-heading mt-0.5">{submittedData.name}</p>
            </div>
            <div>
              <p className="text-theme-muted font-light">Mobile Number</p>
              <p className="font-semibold text-theme-heading mt-0.5">{submittedData.phone}</p>
            </div>
            {submittedData.email && (
              <div className="sm:col-span-2">
                <p className="text-theme-muted font-light">Email Address</p>
                <p className="font-semibold text-theme-heading mt-0.5">{submittedData.email}</p>
              </div>
            )}
            {isRentals && (
              <>
                <div>
                  <p className="text-theme-muted font-light">Vehicle Selected</p>
                  <p className="font-semibold text-theme-gold mt-0.5">{submittedData.vehicleType}</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Trip Type</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.tripType}</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Pickup Point</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Drop Destination</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.destination}</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Pickup Date & Time</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.travelDate} ({submittedData.pickupTime})</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Passengers</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.travellers} Passenger(s)</p>
                </div>
              </>
            )}
            {!isRentals && (
              <>
                <div>
                  <p className="text-theme-muted font-light">Preferred Destination</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.destination || 'Not Specified'}</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Planned Travel Date</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.travelDate || 'Flexible'}</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Number of Travellers</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.travellers ? `${submittedData.travellers} Person(s)` : 'Not Specified'}</p>
                </div>
                <div>
                  <p className="text-theme-muted font-light">Budget Category</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{submittedData.budget || 'Standard'}</p>
                </div>
              </>
            )}
            {submittedData.message && (
              <div className="sm:col-span-2 pt-2 border-t border-theme-border/40">
                <p className="text-theme-muted font-light">Notes / Special Requests</p>
                <p className="font-normal text-theme-heading mt-0.5 italic text-[11px] leading-relaxed">
                  "{submittedData.message}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center max-w-xl">
          <a
            href={submittedData.emailMeta.mailtoUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-theme-gold px-5 py-3 text-xs font-bold text-theme-heading shadow-md transition-all hover:bg-[#ebd074] hover:-translate-y-0.5 w-full sm:w-auto"
          >
            <Mail className="h-4 w-4" />
            Re-open Default Email App
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#20b859] hover:-translate-y-0.5 w-full sm:w-auto"
          >
            <Phone className="h-4 w-4 fill-current" />
            Send via WhatsApp
          </a>

          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setFormData({
                name: '',
                phone: '',
                email: '',
                pickupLocation: '',
                destination: '',
                travelDate: '',
                pickupTime: 'Morning (06:00 AM - 12:00 PM)',
                vehicleType: 'Sedan (Dzire / Etios - 4 Seater)',
                tripType: 'Outstation Round Trip',
                travellers: isRentals ? '4' : '2',
                budget: '',
                message: ''
              });
              setSubmittedData(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-theme-border px-5 py-3 text-xs font-semibold text-theme-heading transition-all hover:bg-theme-navy/5 w-full sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isRentals ? 'Book Another Vehicle' : 'Submit Another Enquiry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-theme-card p-6 sm:p-10 shadow-lg border border-theme-border space-y-6">
      {isRentals && (
        <div className="border-b border-theme-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold font-serif text-theme-heading flex items-center gap-2">
              <Car className="h-5 w-5 text-theme-gold" />
              Car & Vehicle Rental Booking Form
            </h3>
            <p className="text-xs text-theme-muted font-light mt-0.5">
              Fill details to automatically generate and send your booking email to <span className="font-semibold text-theme-gold">{CAB_BOOKING_EMAIL}</span>
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
            Instant Mail Service
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Rajesh Kumar"
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-xl border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
              errors.name 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.name}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. +91 99419 38222"
            className={`w-full rounded-xl border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
              errors.phone 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
            }`}
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.phone}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
            Email Address <span className="text-[10px] text-theme-muted font-normal lowercase">(optional)</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="e.g. customer@example.com"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-xl border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
              errors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.email}
            </p>
          )}
        </div>

        {/* Vehicle Selection for Rentals or General Dropdown */}
        {isRentals ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
              Vehicle Type *
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full rounded-xl border border-theme-border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading focus:border-theme-gold focus:ring-2 focus:ring-theme-gold/20 outline-none transition-all"
            >
              <option value="Sedan (Dzire / Etios - 4 Seater)">Sedan (Dzire / Etios - 4 Seater)</option>
              <option value="SUV (Innova / Crysta - 6-7 Seater)">SUV (Innova / Crysta - 6-7 Seater)</option>
              <option value="Tempo Traveller (12-26 Seater)">Tempo Traveller (12-26 Seater)</option>
              <option value="Luxury Van (Urbania / Commuter)">Luxury Van (Urbania / Commuter)</option>
              <option value="Mini Coach / Bus (30+ Seater)">Mini Coach / Bus (30+ Seater)</option>
              <option value="Other / Custom Vehicle Requirement">Other / Custom Vehicle Requirement</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
              Preferred Destination
            </label>
            <input
              type="text"
              name="destination"
              placeholder="e.g. Kerala, Kashmir, Maldives"
              value={formData.destination}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
                errors.destination 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
              }`}
            />
            {errors.destination && (
              <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                <span>⚠️</span> {errors.destination}
              </p>
            )}
          </div>
        )}

        {/* Rentals-specific: Trip Type and Pickup Location */}
        {isRentals && (
          <>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
                Trip / Rental Type *
              </label>
              <select
                name="tripType"
                value={formData.tripType}
                onChange={handleChange}
                className="w-full rounded-xl border border-theme-border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading focus:border-theme-gold focus:ring-2 focus:ring-theme-gold/20 outline-none transition-all"
              >
                <option value="Outstation Round Trip">Outstation Round Trip</option>
                <option value="Outstation One-Way Drop">Outstation One-Way Drop</option>
                <option value="Airport Pickup / Drop (Chennai)">Airport Pickup / Drop (Chennai)</option>
                <option value="Local City Package (8 Hrs / 80 Km)">Local City Package (8 Hrs / 80 Km)</option>
                <option value="Pilgrimage / Temple Tour">Pilgrimage / Temple Tour</option>
                <option value="Corporate / Event Transport">Corporate / Event Transport</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
                Pickup Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="pickupLocation"
                  required
                  placeholder="e.g. Chennai Airport, T. Nagar, Tambaram"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white dark:bg-[#122238] pl-10 pr-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
                    errors.pickupLocation 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
                  }`}
                />
                <MapPin className="h-4 w-4 text-theme-gold absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              {errors.pickupLocation && (
                <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span>⚠️</span> {errors.pickupLocation}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
                Drop Location / Destination *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="destination"
                  required
                  placeholder="e.g. Pondicherry, Tirupati, Bangalore, City"
                  value={formData.destination}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white dark:bg-[#122238] pl-10 pr-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
                    errors.destination 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
                  }`}
                />
                <MapPin className="h-4 w-4 text-theme-gold absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              {errors.destination && (
                <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span>⚠️</span> {errors.destination}
                </p>
              )}
            </div>
          </>
        )}

        {/* Travel / Pickup Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
            {isRentals ? 'Pickup / Travel Date *' : 'Travel Date'}
          </label>
          <div className="relative">
            <input
              type="date"
              name="travelDate"
              required={isRentals}
              value={formData.travelDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full rounded-xl border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading focus:ring-2 outline-none transition-all ${
                errors.travelDate 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
              }`}
            />
          </div>
          {errors.travelDate && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.travelDate}
            </p>
          )}
        </div>

        {/* Pickup Time / Slot (for Rentals) or Budget (for General) */}
        {isRentals ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
              Preferred Pickup Time
            </label>
            <select
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleChange}
              className="w-full rounded-xl border border-theme-border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading focus:border-theme-gold focus:ring-2 focus:ring-theme-gold/20 outline-none transition-all"
            >
              <option value="Morning (06:00 AM - 12:00 PM)">Morning (06:00 AM - 12:00 PM)</option>
              <option value="Afternoon (12:00 PM - 05:00 PM)">Afternoon (12:00 PM - 05:00 PM)</option>
              <option value="Evening / Night (05:00 PM - 11:00 PM)">Evening / Night (05:00 PM - 11:00 PM)</option>
              <option value="Early Morning (12:00 AM - 06:00 AM)">Early Morning (12:00 AM - 06:00 AM)</option>
              <option value="Flexible / As per schedule">Flexible / As per schedule</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">Budget</label>
            <select
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full rounded-xl border border-theme-border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading focus:border-theme-gold focus:ring-2 focus:ring-theme-gold/20 outline-none"
            >
              <option value="" className="bg-white dark:bg-[#0B192C] text-theme-heading">Select</option>
              <option className="bg-white dark:bg-[#0B192C] text-theme-heading">Economy</option>
              <option className="bg-white dark:bg-[#0B192C] text-theme-heading">Standard</option>
              <option className="bg-white dark:bg-[#0B192C] text-theme-heading">Premium</option>
              <option className="bg-white dark:bg-[#0B192C] text-theme-heading">Luxury</option>
            </select>
          </div>
        )}

        {/* Number of Travellers / Passengers */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
            {isRentals ? 'Passengers / Seats Needed' : 'Travellers'}
          </label>
          <div className="relative">
            <input
              type="number"
              name="travellers"
              min="1"
              max="500"
              placeholder="e.g. 4"
              value={formData.travellers}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-white dark:bg-[#122238] pl-10 pr-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
                errors.travellers 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
              }`}
            />
            <Users className="h-4 w-4 text-theme-gold absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
          {errors.travellers && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {errors.travellers}
            </p>
          )}
        </div>
      </div>
      
      {/* Message / Special Requests */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-theme-heading mb-2">
          {isRentals ? 'Special Requirements / Itinerary Notes' : 'Message or Special Requests'}
        </label>
        <textarea
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          placeholder={
            isRentals 
              ? 'e.g. Flight details, return date/time for round trip, luggage space requirement, AC preference...' 
              : 'Tell us about your trip plans or specific requirements...'
          }
          className={`w-full rounded-xl border bg-white dark:bg-[#122238] px-4 py-3 text-sm text-theme-heading placeholder-slate-400 focus:ring-2 outline-none transition-all ${
            errors.message 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-theme-border focus:border-theme-gold focus:ring-theme-gold/20'
          }`}
        ></textarea>
        {errors.message && (
          <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
            <span>⚠️</span> {errors.message}
          </p>
        )}
      </div>

      {/* Info notice about mail client */}
      {isRentals ? (
        <div className="bg-theme-navy/5 dark:bg-[#0B192C]/50 rounded-xl p-3.5 border border-theme-border/60 flex items-start gap-3">
          <Mail className="h-4 w-4 text-theme-gold shrink-0 mt-0.5" />
          <p className="text-[11px] text-theme-muted font-light leading-relaxed">
            Clicking <strong>Send Rental Booking Email</strong> will launch your device's default mail app (Outlook, Apple Mail, Thunderbird, etc.) with a structured booking template ready to send to <span className="font-semibold text-theme-gold">{CAB_BOOKING_EMAIL}</span>.
          </p>
        </div>
      ) : (
        <div className="bg-theme-navy/5 dark:bg-[#0B192C]/50 rounded-xl p-3.5 border border-theme-border/60 flex items-start gap-3">
          <Mail className="h-4 w-4 text-theme-gold shrink-0 mt-0.5" />
          <p className="text-[11px] text-theme-muted font-light leading-relaxed">
            Clicking <strong>Send Tour Enquiry Email</strong> will launch your device's default mail app (Outlook, Apple Mail, Thunderbird, etc.) with a structured enquiry template ready to send to <span className="font-semibold text-theme-gold">{TOUR_ENQUIRY_EMAIL}</span> (CC: <span className="font-semibold text-theme-gold">{TOUR_ENQUIRY_CC_EMAIL}</span>).
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-theme-navy hover:bg-slate-800 dark:bg-theme-gold dark:text-slate-950 dark:hover:bg-[#ebd074] text-white px-6 py-4 text-sm font-bold shadow-lg shadow-theme-navy/10 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          'Opening Mail Service...'
        ) : isRentals ? (
          <>
            <Mail className="h-5 w-5" />
            Send Rental Booking Email
          </>
        ) : (
          <>
            <Mail className="h-5 w-5" />
            Send Tour Enquiry Email
          </>
        )}
      </button>

      <p className="text-center text-xs text-theme-muted font-light leading-relaxed pt-1">
        * Note: Your email application will open to complete this inquiry. No message is sent automatically.
      </p>
    </form>
  );
}

