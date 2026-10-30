'use client';

import { useState } from 'react';
import {
  Sparkles,
  Star,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Compass,
  Palette,
  Utensils,
  Music,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { IDEA_CATEGORIES, type IdeaCategory } from '@/lib/constants';
import type { AiPlanContent } from '@/lib/schemas';

interface SavedIdeaItem {
  id: string;
  category: string;
  text: string;
  favorite: boolean;
  source: string;
}

interface PlanIdeasTabProps {
  eventId: string;
  aiPlan?: {
    provider: string;
    model: string;
    content: string;
  } | null;
  savedIdeas: SavedIdeaItem[];
  onRefresh: () => void;
}

export function PlanIdeasTab({ eventId, aiPlan, savedIdeas, onRefresh }: PlanIdeasTabProps) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [newIdeaCat, setNewIdeaCat] = useState<IdeaCategory>('Themes');
  const [isAdding, setIsAdding] = useState(false);

  // Parse narrative plan content
  let planContent: AiPlanContent | null = null;
  if (aiPlan?.content) {
    try {
      planContent = JSON.parse(aiPlan.content);
    } catch {
      planContent = null;
    }
  }

  const handleToggleFavorite = async (idea: SavedIdeaItem) => {
    try {
      await fetch(`/api/events/${eventId}/ideas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          favorite: !idea.favorite,
        }),
      });
      onRefresh();
    } catch {
      alert('Failed to update favorite status');
    }
  };

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaText.trim()) return;

    try {
      setIsAdding(true);
      const res = await fetch(`/api/events/${eventId}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newIdeaCat,
          text: newIdeaText.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to add idea');
      setNewIdeaText('');
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding idea');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm('Remove this saved idea?')) return;
    try {
      await fetch(`/api/events/${eventId}/ideas?ideaId=${ideaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      onRefresh();
    } catch {
      alert('Failed to delete idea');
    }
  };

  // Filter ideas
  const filteredIdeas = savedIdeas.filter((idea) => {
    if (showFavoritesOnly && !idea.favorite) return false;
    if (activeCategory !== 'ALL' && idea.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Narrative Plan Blueprint */}
      {planContent && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DBCB] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#8B7BB8]" />
              <h2 className="font-serif text-xl font-bold text-[#26232B]">Master Event Blueprint</h2>
            </div>
            <span className="text-[11px] font-bold text-[#8B7BB8] px-2.5 py-1 rounded bg-[#F3ECE0]">
              Synthesized by {aiPlan?.provider === 'gemini' ? `Gemini (${aiPlan.model})` : 'Demo Engine'}
            </span>
          </div>

          {/* Overview */}
          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E5DBCB] space-y-1 text-xs">
            <span className="font-bold text-[#26232B] uppercase tracking-wider block">Overview</span>
            <p className="text-[#665F6B] leading-relaxed text-sm">{planContent.overview}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-[#E5DBCB] space-y-1.5 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-[#26232B]">
                <Palette className="w-4 h-4 text-[#8B7BB8]" />
                <span>Theme & Decor</span>
              </div>
              <p className="text-[#665F6B] leading-relaxed">{planContent.decoration}</p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5DBCB] space-y-1.5 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-[#26232B]">
                <Utensils className="w-4 h-4 text-[#E8735A]" />
                <span>Food & Catering</span>
              </div>
              <p className="text-[#665F6B] leading-relaxed">{planContent.food}</p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5DBCB] space-y-1.5 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-[#26232B]">
                <Music className="w-4 h-4 text-[#C9A96A]" />
                <span>Entertainment & Experience</span>
              </div>
              <p className="text-[#665F6B] leading-relaxed">{planContent.entertainment}</p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5DBCB] space-y-1.5 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-[#26232B]">
                <ShieldAlert className="w-4 h-4 text-[#E8735A]" />
                <span>Risks & Safeguards</span>
              </div>
              <p className="text-[#665F6B] leading-relaxed">{planContent.risks}</p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5DBCB] space-y-1.5 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-[#26232B]">
                <CheckCircle2 className="w-4 h-4 text-[#3C8C30]" />
                <span>Contingency Planning</span>
              </div>
              <p className="text-[#665F6B] leading-relaxed">{planContent.contingencies}</p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5DBCB] space-y-1.5 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-[#26232B]">
                <Compass className="w-4 h-4 text-[#8B7BB8]" />
                <span>Budget & Vendor Strategy</span>
              </div>
              <p className="text-[#665F6B] leading-relaxed">{planContent.budgetStrategy}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ideas Studio */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DBCB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5DBCB] pb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#C9A96A]" />
            <div>
              <h2 className="font-serif text-xl font-bold text-[#26232B]">Ideas Studio</h2>
              <p className="text-xs text-[#665F6B]">Custom creative suggestions, star your favorites, or record your own concepts.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showFavoritesOnly
                  ? 'bg-[#C9A96A] text-white border-[#C9A96A]'
                  : 'border-[#E5DBCB] text-[#665F6B] hover:bg-[#FAF6EF]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-white' : ''}`} />
              <span>Favorites Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              activeCategory === 'ALL'
                ? 'bg-[#26232B] text-[#FAF6EF]'
                : 'bg-[#F3ECE0] text-[#665F6B] hover:bg-[#EAE1D1]'
            }`}
          >
            All Categories
          </button>
          {IDEA_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                activeCategory === cat
                  ? 'bg-[#8B7BB8] text-white'
                  : 'bg-[#FAF6EF] border border-[#E5DBCB] text-[#665F6B] hover:bg-[#F3ECE0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Add Idea Input */}
        <form onSubmit={handleAddIdea} className="flex flex-col sm:flex-row gap-2 pt-2">
          <select
            value={newIdeaCat}
            onChange={(e) => setNewIdeaCat(e.target.value as IdeaCategory)}
            className="px-3 py-2 rounded-xl border border-[#E5DBCB] text-xs font-medium bg-white shrink-0"
          >
            {IDEA_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={newIdeaText}
            onChange={(e) => setNewIdeaText(e.target.value)}
            placeholder="Record an event idea or custom creative detail..."
            className="flex-1 px-4 py-2 rounded-xl border border-[#E5DBCB] text-xs focus:border-[#8B7BB8]"
          />
          <button
            type="submit"
            disabled={isAdding}
            className="px-4 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold hover:bg-[#3D3845] transition-colors shrink-0 flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-[#C9A96A]" />
            <span>Add Idea</span>
          </button>
        </form>

        {/* Ideas Grid */}
        {filteredIdeas.length === 0 ? (
          <p className="text-xs text-[#665F6B] text-center py-8">No ideas match the selected filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-2xl border border-[#E5DBCB] bg-[#FAF6EF]/40 hover:bg-[#FAF6EF] transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white border border-[#E5DBCB] text-[#8B7BB8]">
                      {idea.category}
                    </span>
                    <button
                      onClick={() => handleToggleFavorite(idea)}
                      title={idea.favorite ? 'Unstar' : 'Star as favorite'}
                      className="text-[#C9A96A] hover:scale-110 transition-transform p-1"
                    >
                      <Star className={`w-4 h-4 ${idea.favorite ? 'fill-[#C9A96A]' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-[#26232B] leading-relaxed font-medium">{idea.text}</p>
                </div>

                <div className="pt-2 border-t border-[#E5DBCB]/60 flex items-center justify-between text-[11px] text-[#665F6B]">
                  <span>{idea.source === 'AI' ? 'AI Concept' : 'Custom'}</span>
                  <button
                    onClick={() => handleDeleteIdea(idea.id)}
                    className="text-[#E8735A] hover:text-[#D45E45] p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

