'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { useCreateSubject } from '@/hooks/use-subjects'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateSubjectSchemaApi,
  TCreateSubjectSchemaApi,
} from '@/lib/schemas/subject'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

export function NewSubjectForm() {
  const router = useRouter()
  const { mutateAsync: createSubject } = useCreateSubject()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TCreateSubjectSchemaApi>({
    resolver: zodResolver(CreateSubjectSchemaApi),
    defaultValues: {
      name: '',
    },
  })

  const onSubmit = async (data: TCreateSubjectSchemaApi) => {
    try {
      await createSubject(data)
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <motion.div
      className="flex flex-col gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        className="border-border border-b pb-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <motion.button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
        </div>
        <h1 className="text-foreground text-[28px] font-[800] tracking-[-0.03em]">
          Create Subject
        </h1>
        <p className="text-muted-foreground/60 mt-2 text-[13px] font-[500]">
          Add a new subject to organize your study sessions
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Name Input */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="text-foreground block text-[12px] font-[700] tracking-[0.04em] uppercase">
            Subject Name
          </label>
          <input
            {...register('name')}
            placeholder="e.g., Advanced Calculus"
            className="bg-surface border-border text-foreground placeholder:text-muted-foreground/40 focus:border-violet-mid focus:ring-violet-mid/30 w-full rounded-xl border px-4 py-3 text-[14px] transition-all focus:ring-1 focus:outline-none"
          />
          {errors.name && (
            <p className="text-[11px] font-[600] text-red-500">
              {errors.name.message}
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-3 pt-4">
          <motion.button
            type="button"
            onClick={() => router.back()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="border-border text-muted-foreground hover:text-foreground hover:border-border-up flex-1 rounded-xl border px-6 py-3 text-[12px] font-[700] transition-all"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-violet border-violet flex flex-1 items-center justify-center gap-2 rounded-xl border px-6 py-3 text-[12px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)] transition-all hover:shadow-[0_0_30px_var(--color-violet-glow)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                Creating...
              </>
            ) : (
              'Create Subject'
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  )
}
