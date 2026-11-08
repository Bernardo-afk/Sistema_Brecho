import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ConfirmHost, Spinner, Toaster } from '@/design-system';
import { ReservationWatcher } from '@/components/ReservationWatcher';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HomePage } from '@/pages/public/HomePage';
import { AmbientePage, AmbientesPage, CatalogPage, CategoryPage } from '@/pages/public/CatalogPages';
import { ProductPage } from '@/pages/public/ProductPage';
import { AccountPage, CartPage, CheckoutPage, OrderPage, PaymentPage } from '@/pages/public/CommercePages';
import { AboutPage, ArticlePage, JournalPage, NotFoundPage, PrivacyPage, TermsPage } from '@/pages/public/InstitutionalPages';

// O painel administrativo é carregado sob demanda (não pesa na loja pública).
const AdminApp = lazy(() => import('@/pages/admin/AdminApp'));

// HashRouter: funciona em hospedagem estática (GitHub Pages) sem regras de reescrita.
export function App() {
  return (
    <HashRouter>
      <ReservationWatcher />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="loja" element={<CatalogPage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="produto/:slug" element={<ProductPage />} />
          <Route path="ambientes" element={<AmbientesPage />} />
          <Route path="ambientes/:id" element={<AmbientePage />} />
          <Route path="carrinho" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="pedido/:code" element={<OrderPage />} />
          <Route path="pedido/:code/pagamento" element={<PaymentPage />} />
          <Route path="conta" element={<AccountPage />} />
          <Route path="editorial" element={<JournalPage />} />
          <Route path="editorial/:slug" element={<ArticlePage />} />
          <Route path="quem-somos" element={<AboutPage />} />
          <Route path="termos" element={<TermsPage />} />
          <Route path="privacidade" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense fallback={<Spinner label="Abrindo o painel…" />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
      <Toaster />
      <ConfirmHost />
    </HashRouter>
  );
}
