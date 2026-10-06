import { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import './ReviewsSection.css';

const reviews = [
  {
    name: 'Sarah Jenkins',
    role: 'Lead Marketing Ops, TechFlow',
    content: 'This platform saved us hundreds of engineering hours. Deploying complex GA4 architectures is now a one-click process. Absolutely incredible.',
    avatar: 'https://i.pravatar.cc/150?img=47'
  },
  {
    name: 'Marcus Chen',
    role: 'Head of Analytics, GlobalMart',
    content: 'The edge-native execution means zero impact on our core web vitals. It is the fastest Tag Manager deployment tool I have ever used.',
    avatar: 'https://i.pravatar.cc/150?img=11'
  },
  {
    name: 'Elena Rodriguez',
    role: 'Founder, ConvertX',
    content: 'Finally, a tool that understands the complexities of enterprise tracking architectures. The built-in recipes are a lifesaver.',
    avatar: 'https://i.pravatar.cc/150?img=32'
  },
  {
    name: 'David Smith',
    role: 'E-commerce Director, ShopWave',
    content: 'GTMAuto revolutionized how we handle data layers for new store rollouts. It took our deployment time from weeks to literally seconds.',
    avatar: 'https://i.pravatar.cc/150?img=59'
  },
  {
    name: 'Aisha Patel',
    role: 'Performance Marketer, AdScale',
    content: 'The ability to skip existing tags without breaking the container is brilliant. We use this for all our client onboardings now.',
    avatar: 'https://i.pravatar.cc/150?img=44'
  },
  {
    name: 'Tom Reynolds',
    role: 'CTO, DataStack',
    content: 'Secure edge-native deployment that bypasses traditional server bloat. I am incredibly impressed by the API integration.',
    avatar: 'https://i.pravatar.cc/150?img=15'
  },
  {
    name: 'Chloe Dubois',
    role: 'SEO Specialist, RankHigher',
    content: 'Not having to rely on our dev team to setup standard events is a massive win. GTMAuto pays for itself on day one.',
    avatar: 'https://i.pravatar.cc/150?img=20'
  }
];

export const ReviewsSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="reviews-section" id="reviews">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="section-header"
      >
        <h2 className="section-title">Loved by Marketing Engineers</h2>
        <p className="section-subtitle">See what enterprise teams are saying about our zero-latency automation.</p>
      </motion.div>

      <div className="reviews-slider-container">
        <button onClick={scrollPrev} className="slider-arrow slider-arrow-left" aria-label="Previous review">
          <ChevronLeft size={24} />
        </button>

        <div className="embla" ref={emblaRef}>
          <div className="embla__container">
            {reviews.map((review, index) => (
              <div key={index} className="embla__slide">
                <div className="review-card">
                  <div className="stars">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={16} className="star-icon" fill="currentColor" />
                    ))}
                  </div>
                  <p className="review-content">"{review.content}"</p>
                  <div className="review-author">
                    <img src={review.avatar} alt={review.name} className="author-avatar" />
                    <div className="author-info">
                      <h4 className="author-name">{review.name}</h4>
                      <span className="author-role">{review.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={scrollNext} className="slider-arrow slider-arrow-right" aria-label="Next review">
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
};
