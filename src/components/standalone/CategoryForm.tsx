import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import type { StandaloneCategory } from '@/types/standalone';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory?: StandaloneCategory;
}

export function CategoryForm({ isOpen, onClose, editCategory }: CategoryFormProps) {
  const { getCategories, addCategory, updateCategory } = useStandaloneCatalogStore();
  const categories = getCategories();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or editCategory changes
  useEffect(() => {
    if (isOpen) {
      if (editCategory) {
        setName(editCategory.name);
        setIsActive(editCategory.isActive);
      } else {
        setName('');
        setIsActive(true);
      }
      setError('');
    }
  }, [isOpen, editCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t(lang, 'standalone.categoryNameRequired'));
      return;
    }

    // Check for duplicate name
    const duplicate = categories.find(
      (c) =>
        c.name.toLowerCase() === name.trim().toLowerCase() &&
        c.id !== editCategory?.id
    );
    if (duplicate) {
      setError(t(lang, 'standalone.categoryNameDuplicate'));
      return;
    }

    if (editCategory) {
      updateCategory(editCategory.id, { name: name.trim(), isActive });
    } else {
      const maxSortOrder = Math.max(0, ...categories.map((c) => c.sortOrder));
      addCategory({
        name: name.trim(),
        sortOrder: maxSortOrder + 1,
        isActive,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editCategory ? t(lang, 'standalone.editCategory') : t(lang, 'standalone.addCategory')}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#3D405B] mb-2">
            {t(lang, 'standalone.categoryName')} *
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={t(lang, 'standalone.categoryNamePlaceholder')}
            autoFocus
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between bg-[#FAFAF8] rounded-xl border border-[#E8E2D9] p-4">
          <div>
            <p className="font-medium text-[#3D405B]">{t(lang, 'standalone.active')}</p>
            <p className="text-sm text-[#8D8D9B]">{t(lang, 'standalone.categoryActiveDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              isActive ? 'bg-[#E07A5F]' : 'bg-[#E8E2D9]'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isActive ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t(lang, 'pos.cancel')}
          </Button>
          <Button type="submit" fullWidth>
            {editCategory ? t(lang, 'standalone.save') : t(lang, 'standalone.addCategory')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
