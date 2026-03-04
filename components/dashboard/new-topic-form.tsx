'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Plus, X } from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useCreateTopic } from '@/hooks/use-topics'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateTopicSchemaApi,
  TCreateTopicSchemaApi,
} from '@/lib/schemas/topic'

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

export function NewTopicForm() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params.id as string
  const [inputTag, setInputTag] = useState('')

  const { mutateAsync: createTopic } = useCreateTopic()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TCreateTopicSchemaApi>({
    resolver: zodResolver(CreateTopicSchemaApi),
    defaultValues: {
      name: '',
      description: '',
      tags: [],
    },
  })

  const formTags = watch('tags') || []

  const handleAddTag = () => {
    if (inputTag.trim() && !formTags.includes(inputTag.trim())) {
      setValue('tags', [...formTags, inputTag.trim()])
      setInputTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setValue(
      'tags',
      formTags.filter((t) => t !== tag)
    )
  }

  const onSubmit = async (data: TCreateTopicSchemaApi) => {
    try {
      await createTopic({
        subjectId,
        payload: data,
      })
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
          Create Topic
        </h1>
        <p className="text-muted-foreground/60 mt-2 text-[13px] font-[500]">
          Add a new topic to this subject
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Title Input */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="text-foreground block text-[12px] font-[700] tracking-[0.04em] uppercase">
            Topic Title
          </label>
          <input
            {...register('name')}
            placeholder="e.g., Integration by Parts"
            className="bg-surface border-border text-foreground placeholder:text-muted-foreground/40 focus:border-violet-mid focus:ring-violet-mid/30 w-full rounded-xl border px-4 py-3 text-[14px] transition-all focus:ring-1 focus:outline-none"
          />
          {errors.name && (
            <p className="text-[11px] font-[600] text-red-500">
              {errors.name.message}
            </p>
          )}
        </motion.div>

        {/* Description Input */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="text-foreground block text-[12px] font-[700] tracking-[0.04em] uppercase">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Add some context about this topic..."
            rows={4}
            className="bg-surface border-border text-foreground placeholder:text-muted-foreground/40 focus:border-violet-mid focus:ring-violet-mid/30 w-full resize-none rounded-xl border px-4 py-3 text-[14px] transition-all focus:ring-1 focus:outline-none"
          />
          {errors.description && (
            <p className="text-[11px] font-[600] text-red-500">
              {errors.description.message}
            </p>
          )}
        </motion.div>

        {/* Tags Input */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="text-foreground block text-[12px] font-[700] tracking-[0.04em] uppercase">
            Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputTag}
              onChange={(e) => setInputTag(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && (e.preventDefault(), handleAddTag())
              }
              placeholder="Add a tag and press Enter"
              className="bg-surface border-border text-foreground placeholder:text-muted-foreground/40 focus:border-violet-mid focus:ring-violet-mid/30 flex-1 rounded-xl border px-4 py-3 text-[14px] transition-all focus:ring-1 focus:outline-none"
            />
            <motion.button
              type="button"
              onClick={handleAddTag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-violet border-violet flex items-center gap-2 rounded-xl border px-4 py-3 text-[12px] font-[700] text-white shadow-[0_0_12px_var(--color-violet-glow)] transition-all hover:shadow-[0_0_20px_var(--color-violet-glow)]"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Tags Display */}
          <AnimatePresence>
            {formTags.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {formTags.map((tag, idx) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-violet/10 border-violet/20 text-violet-mid flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-[600]"
                  >
                    {tag}
                    <motion.button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
              'Create Topic'
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  )
}
