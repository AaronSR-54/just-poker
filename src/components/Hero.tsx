import React from 'react';
import { motion } from 'framer-motion';
import { container, fadeUp } from '../animations/motion';
import { useI18n } from '../i18n';
import Wordmark from './Wordmark';

interface HeroProps {
  /** Ajusta tamaño y disposición para el layout móvil o de escritorio. */
  size?: 'mobile' | 'desktop';
}

/**
 * Hero de la portada: la marca, el párrafo descriptivo y el eslogan. Antes
 * estaba duplicado (móvil y escritorio) dentro de Menu; ahora vive aquí y solo
 * cambia la escala según `size`.
 */
const Hero: React.FC<HeroProps> = ({ size = 'desktop' }) => {
  const { t } = useI18n();
  const mobile = size === 'mobile';

  return (
    <motion.div
      variants={container(0.09, 0.05)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col gap-3 ${mobile ? '' : 'flex-[55] justify-center'}`}
    >
      <motion.div variants={fadeUp}>
        <Wordmark
          layout="stack"
          className={
            mobile
              ? 'flex flex-col uppercase text-[clamp(2.5rem,min(30vw,14vh),12rem)] leading-[0.86] tracking-[-0.015em]'
              : 'flex flex-col uppercase text-[clamp(6rem,18vw,15rem)] leading-[0.825] tracking-[-0.015em]'
          }
        />
      </motion.div>
      <motion.p
        variants={fadeUp}
        className={`mb-0 mt-1.5 font-body leading-[1.45] text-left opacity-70 ${mobile ? '' : 'w-0 min-w-full'}`}
      >
        {t('menu.paragraph')}
      </motion.p>
      <motion.div variants={fadeUp} className="font-body leading-[1.45]">
        {t('menu.tagline')}
      </motion.div>
    </motion.div>
  );
};

export default Hero;
