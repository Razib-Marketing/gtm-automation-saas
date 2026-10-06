import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const FeatureCard = ({ title, description, icon }: FeatureCardProps) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="feature-card-wrapper group"
    >
      <div className="feature-card-glow transition-opacity duration-500 z-0"/>
      <div className="feature-card-content z-10 flex flex-col gap-4">
        <div className="feature-card-icon">{icon}</div>
        <h3 className="feature-card-title">{title}</h3>
        <p className="feature-card-description">{description}</p>
      </div>
    </motion.div>
  );
};
