"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@saasfly/ui/button";

const properties = [
  {
    id: "1",
    title: "Narai",
    price: "120,000,000 MXN",
    image: "/images/coin.png",
    description: "Una villa de lujo con vista al mar y acabados de alta gama.",
  },
  {
    id: "2",
    title: "Downtown Apartment",
    price: "300,000 USDC",
    image: "/images/coin.png",
    description: "Moderno apartamento en el centro de la ciudad, excelente inversión.",
  },
];

export default function PropertiesPage() {
  const [selectedProperty, setSelectedProperty] = useState<{
    id: string;
    title: string;
    price: string;
    image: string;
    description: string;
  } | null>(null);
  

  return (
    <section className="container mx-auto p-6 text-center">
      <h2 className="text-3xl font-bold mb-8">Propiedades Disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((property) => (
          <motion.div
            key={property.id}
            className="bg-white shadow-lg rounded-xl overflow-hidden"
            whileHover={{ scale: 1.05 }}
          >
            <Image src={property.image} alt={property.title} width={800} height={450} />
            <div className="p-4">
              <h3 className="text-xl font-semibold">{property.title}</h3>
              <p className="text-gray-600">{property.price}</p>
              <div className="flex justify-between mt-4">
                <Button onClick={() => setSelectedProperty(property)} variant="outline">
                  Details
                </Button>
                
                  <Button variant="default">Get Tokens</Button>
            
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProperty(null)}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-4/5 md:w-1/3 relative"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-lg"
                onClick={() => setSelectedProperty(null)}
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-2">{selectedProperty?.title}</h3>
              <p className="text-gray-700">{selectedProperty?.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
