import { motion } from 'framer-motion';
import { Command, Hexagon, Triangle, CircleDashed, Infinity as InfinityIcon } from 'lucide-react';
import './ClientsSection.css';

const clients = [
  { name: 'Acme Corp', icon: <Command size={32} /> },
  { name: 'Global Tech', icon: <Hexagon size={32} /> },
  { name: 'Nexus Industries', icon: <Triangle size={32} /> },
  { name: 'Quantum UI', icon: <CircleDashed size={32} /> },
  { name: 'Infinite Analytics', icon: <InfinityIcon size={32} /> },
  // Duplicate for seamless loop
  { name: 'Acme Corp', icon: <Command size={32} /> },
  { name: 'Global Tech', icon: <Hexagon size={32} /> },
  { name: 'Nexus Industries', icon: <Triangle size={32} /> },
  { name: 'Quantum UI', icon: <CircleDashed size={32} /> },
  { name: 'Infinite Analytics', icon: <InfinityIcon size={32} /> },
];

export const ClientsSection = () => {
  return (
    <div className="clients-section">
      <p className="clients-label">TRUSTED BY INNOVATIVE TEAMS WORLDWIDE</p>
      <div className="marquee-container">
        <motion.div 
          className="marquee-track"
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          {[...clients, ...clients].map((client, index) => (
            <div key={`${client.name}-${index}`} className="client-logo">
              {client.icon}
              <span className="client-name">{client.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
