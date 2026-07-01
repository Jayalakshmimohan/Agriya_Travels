import { PhoneIcon as WhatsAppIcon } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';
import { motion } from 'motion/react';

export default function FloatingWhatsApp() {
  const currentHour = new Date().getHours();
  const isBusinessHours = currentHour >= 9 && currentHour < 18;
  const message = isBusinessHours 
    ? 'Hi Agriya Travels, I am interested in your travel packages' 
    : 'We are currently offline, leave us a message';
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", bounce: 0.5, delay: 1 }}
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[120px] lg:bottom-6 right-4 lg:right-8 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgb(37,211,102,0.4)] transition-transform hover:scale-110 hover:shadow-[0_8px_30px_rgb(37,211,102,0.6)] focus:outline-none before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-[#25D366] before:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7 fill-current relative z-10" />
    </motion.a>
  );
}
