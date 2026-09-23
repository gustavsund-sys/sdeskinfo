import React,{lazy,Suspense}from'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Navigate,Route,Routes}from'react-router-dom';import'./styles.css';
import{ErrorBoundary}from'./components/ErrorBoundary';import{DisplayPage}from'./pages/DisplayPage';
const AdminApp=lazy(()=>import('./pages/AdminApp').then(module=>({default:module.AdminApp})));
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><BrowserRouter><Routes><Route path="/display" element={<DisplayPage/>}/><Route path="/admin/*" element={<Suspense fallback={<div className="admin-loading">Service desk</div>}><AdminApp/></Suspense>}/><Route path="*" element={<Navigate to="/display" replace/>}/></Routes></BrowserRouter></ErrorBoundary></React.StrictMode>);
