'use client';

import React, { PropsWithChildren } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Menu from "./Menu";
import { Toaster } from "@/components/ui/toaster"

const Layout: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <main>
      <Header />
      <Menu />
      {children}
      <Toaster />
      <Footer />
    </main>
  );
};

export default Layout;