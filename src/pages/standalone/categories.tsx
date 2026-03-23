import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CategoryListItem } from '@/components/standalone/CategoryListItem';
import { CategoryForm } from '@/components/standalone/CategoryForm';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { Plus, Folder } from 'lucide-react';
import { StandaloneSubPageHeader } from '@/components/standalone/StandaloneSubPageHeader';
import type { StandaloneCategory } from '@/types/standalone';

export default function StandaloneCategoriesPage() {
  const { getCategories, getProducts, deleteCategory } = useStandaloneCatalogStore();
  const categories = getCategories();
  const products = getProducts();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<StandaloneCategory | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<StandaloneCategory | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Sort categories by sortOrder
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleEdit = (category: StandaloneCategory) => {
    setEditCategory(category);
    setShowForm(true);
  };

  const handleDelete = (category: StandaloneCategory) => {
    const productCount = products.filter((p) => p.categoryId === category.id).length;
    if (productCount > 0) {
      setDeleteError(t(lang, 'standalone.categoryHasProducts'));
      setDeleteConfirm(category);
    } else {
      setDeleteError('');
      setDeleteConfirm(category);
    }
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      const success = deleteCategory(deleteConfirm.id);
      if (!success) {
        setDeleteError(t(lang, 'standalone.categoryHasProducts'));
        return;
      }
      setDeleteConfirm(null);
      setDeleteError('');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditCategory(undefined);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <StandaloneSubPageHeader
        title={t(lang, 'standalone.categories')}
        rightAction={
          <button
            onClick={() => setShowForm(true)}
            className="p-2 bg-[#E07A5F] hover:bg-[#C86A50] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      {/* Category list */}
      <div className="flex-1 p-4">
        {sortedCategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-64 flex flex-col items-center justify-center text-center"
          >
            <Folder className="w-16 h-16 text-[#E8E2D9] mb-4" />
            <h3 className="text-lg font-medium text-[#3D405B] mb-1">
              {t(lang, 'standalone.noCategories')}
            </h3>
            <p className="text-sm text-[#8D8D9B] mb-4">
              {t(lang, 'standalone.noCategoriesHint')}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t(lang, 'standalone.addCategory')}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#8D8D9B] mb-4">
              {t(lang, 'standalone.categoriesHint')}
            </p>
            {sortedCategories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Category form modal */}
      <CategoryForm
        isOpen={showForm}
        onClose={handleFormClose}
        editCategory={editCategory}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => {
          setDeleteConfirm(null);
          setDeleteError('');
        }}
        title={t(lang, 'standalone.deleteCategory')}
        size="sm"
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-red-600">{deleteError}</p>
            </div>
          ) : (
            <p className="text-[#8D8D9B]">
              {t(lang, 'standalone.deleteCategoryConfirm', { name: deleteConfirm?.name || '' })}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteError('');
              }}
            >
              {t(lang, 'pos.cancel')}
            </Button>
            {!deleteError && (
              <Button
                fullWidth
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                {t(lang, 'standalone.delete')}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
