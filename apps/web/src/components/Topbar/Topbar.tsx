import styles from "./Topbar.module.css";
import { SearchIcon } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { SyntheticEvent } from "react";

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const inputDefaultValue =
    location.pathname === "/search" ? (searchParams.get("q") ?? "") : "";

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const rawValue = formData.get("q");
    const trimmed = typeof rawValue === "string" ? rawValue.trim() : "";

    if (!trimmed) {
      return;
    }

    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className={styles.container}>
      <form
        role="search"
        className={styles.searchContainer}
        onSubmit={handleSubmit}
      >
        <SearchIcon size={18} />
        <input
          key={`${location.pathname}?${location.search}`}
          type="text"
          name="q"
          placeholder="Search..."
          aria-label="Search"
          className={styles.searchInput}
          defaultValue={inputDefaultValue}
        />
      </form>
    </header>
  );
}
