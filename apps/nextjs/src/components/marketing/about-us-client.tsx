'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

// Main component for the About Us page
export function AboutUsClient({ dict }: { dict: any }) {
  return (
    <div className="min-h-screen w-full text-white bg-black">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-center mb-12 text-purple-300"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {dict.title}
        </motion.h1>

        <Section title={dict.the_big_why.title}>
          <p className="text-lg text-gray-300 mb-4">{dict.the_big_why.p1}</p>
          <p className="text-lg text-gray-300 mb-4">{dict.the_big_why.p2}</p>
          <p className="text-lg text-gray-300">{dict.the_big_why.p3}</p>
        </Section>

        <Section title={dict.our_mission.title}>
          <p className="text-lg text-gray-300">{dict.our_mission.content}</p>
        </Section>

        <Section title={dict.what_we_do.title}>
          <p className="text-lg text-gray-300 mb-6">{dict.what_we_do.intro}</p>
          <h3 className="text-2xl font-bold text-lime-300 mb-4">{dict.what_we_do.services_title}</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {dict.what_we_do.services.map((service: any, index: number) => (
              <motion.div
                key={index}
                className="p-6 bg-gray-900 rounded-lg border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="text-xl font-bold text-white mb-2">{service.title}</h4>
                <p className="text-gray-400">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title={dict.our_current_position.title}>
          <p className="text-lg text-gray-300 mb-4">{dict.our_current_position.intro}</p>
          <ul className="space-y-2">
            {dict.our_current_position.points.map((point: string, index: number) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-6 w-6 text-lime-300 mr-3 mt-1 flex-shrink-0" />
                <span className="text-lg text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={dict.the_team.title}>
          <p className="text-lg text-gray-300 mb-6">{dict.the_team.intro}</p>
          <div className="grid md:grid-cols-2 gap-8">
            {dict.the_team.areas.map((area: any, index: number) => (
              <motion.div
                key={index}
                className="p-6 bg-gray-900 rounded-lg border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="text-xl font-bold text-white mb-2">{area.title}</h4>
                <p className="text-gray-400">{area.description}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title={dict.strategic_allies.title}>
          <p className="text-lg text-gray-300 mb-6">{dict.strategic_allies.intro}</p>
          <div className="space-y-4">
            {dict.strategic_allies.categories.map((category: any, index: number) => (
              <div key={index}>
                <h4 className="text-xl font-semibold text-lime-300">{category.name}</h4>
                <p className="text-gray-400">{category.partners}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={dict.roadmap.title}>
            <p className="text-lg text-gray-300 mb-8">{dict.roadmap.intro}</p>
            <div className="relative border-l-2 border-lime-300 pl-8">
                {dict.roadmap.timeline.map((item: any, index: number) => (
                    <motion.div 
                        key={index} 
                        className="mb-8 relative"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        viewport={{ once: true }}
                    >
                        <div className="absolute -left-10 h-4 w-4 bg-lime-300 rounded-full mt-1.5"></div>
                        <h4 className="text-2xl font-bold text-white mb-2">{item.year}</h4>
                        <p className="text-gray-400">{item.description}</p>
                    </motion.div>
                ))}
            </div>
        </Section>

        <Section title={dict.cta.title}>
          <p className="text-lg text-center text-gray-300">{dict.cta.content}</p>
        </Section>

      </div>
    </div>
  );
}

// Section sub-component for consistent styling
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <h2 className="text-3xl font-bold text-center mb-8 text-lime-300 font-shadows">{title}</h2>
      {children}
    </motion.section>
  );
}
