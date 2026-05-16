"use client";

import { motion } from "motion/react";
import Image from "next/image";

interface OGCardImageProps {
  src: string;
  alt: string;
}

export default function OGCardImage({ src, alt }: OGCardImageProps) {
  return (
    <div className="relative overflow-hidden h-[40vh] bg-gray-100 dark:bg-gray-800 group cursor-pointer">
      {/* Blurred Background Fill */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 scale-110"
        style={{ backgroundImage: `url(${src})` }}
      />

      {/* 
        THE "SCALE-TO-REVEAL" TRICK:
        We use 'object-contain' so the image can be shown in full.
        To make it look like 'object-cover' initially, we scale it up.
        Then we animate the scale back to 1 to reveal the whole image smoothly.
      */}
      <motion.div
        className="relative w-full h-full"
        initial={{ scale: 1.8 }}
        whileHover={{ scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1] // Super smooth expo-out easing
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 480px"
          unoptimized={src.startsWith("data:")}
        />
      </motion.div>
    </div>
  );
}
