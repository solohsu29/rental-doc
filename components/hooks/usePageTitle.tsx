import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { menuRoutes } from "../data/menu-routes";

 // assuming you renamed it accordingly

interface MenuItem {
  name?: string;
  active?: boolean;
  subPaths?: MenuItem[];
}

export const usePageTitle = () => {
  const pathname = usePathname();
  const router = useRouter();


  const hasChild = !!pathname.split("/")[3];

  const getActiveName = (
    items: MenuItem[],
    path: string
  ): { title?: string; isSubPath: boolean } => {
    const activeItem = items.find(
      (item) => item.active || item.subPaths?.some((sub) => sub.active)
    );

    if (hasChild) {
      return {
        title: activeItem?.subPaths?.find((sub) => sub.active)?.name,
        isSubPath: true,
      };
    }

    return { title: activeItem?.name, isSubPath: false };
  };

  const titleData = useMemo(() => {
    const menuItems = menuRoutes(pathname); // use the only menu
    return getActiveName(menuItems, pathname);
  }, [pathname, router]);

  return {
    titleData,
    routname: "admin",
  };
};
