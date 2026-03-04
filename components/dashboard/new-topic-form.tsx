'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
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

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [inputTag, setInputTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTag = () => {
    if (inputTag.trim() && !tags.includes(inputTag.trim())) {
      setTags([...tags, inputTag.trim()])
      setInputTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // TODO: Wire up to actual API
    await new Promise(resolve => setTimeout(resolve, 800))
    router.push('/dashboard')
  }

  return (
    <motion.div
      className="flex flex-col gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <motion.button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        </div>
        <h1 className="text-foreground text-[28px] font-[800] tracking-[-0.03em]">
          Create Topic
        </h1>
        <p className="text-muted-foreground/60 text-[13px] font-[500] mt-2">
          Add a new topic to this subject
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title Input */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="block text-foreground text-[12px] font-[700] tracking-[0.04em] uppercase">
            Topic Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Integration by Parts"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-mid focus:ring-1 focus:ring-violet-mid/30 transition-all text-[14px]"
          />
        </motion.div>

        {/* Description Input */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="block text-foreground text-[12px] font-[700] tracking-[0.04em] uppercase">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some context about this topic..."
            rows={4}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-mid focus:ring-1 focus:ring-violet-mid/30 transition-all text-[14px] resize-none"
          />
        </motion.div>

        {/* Tags Input */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="block text-foreground text-[12px] font-[700] tracking-[0.04em] uppercase">
            Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputTag}
              onChange={(e) => setInputTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag and press Enter"
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-mid focus:ring-1 focus:ring-violet-mid/30 transition-all text-[14px]"
            />
            <motion.button
              type="button"
              onClick={handleAddTag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-violet border border-violet rounded-xl px-4 py-3 text-white font-[700] text-[12px] shadow-[0_0_12px_var(--color-violet-glow)] hover:shadow-[0_0_20px_var(--color-violet-glow)] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Tags Display */}
          <AnimatePresence>
            {tags.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {tags.map((tag, idx) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2 bg-violet/10 border border-violet/20 rounded-xl px-3 py-1.5 text-[12px] font-[600] text-violet-mid"
                  >
                    {tag}
                    <motion.button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-3 h-3" />
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
            className="flex-1 border border-border rounded-xl px-6 py-3 text-[12px] font-[700] text-muted-foreground hover:text-foreground hover:border-border-up transition-all"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-violet border border-violet rounded-xl px-6 py-3 text-[12px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)] hover:shadow-[0_0_30px_var(--color-violet-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
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
