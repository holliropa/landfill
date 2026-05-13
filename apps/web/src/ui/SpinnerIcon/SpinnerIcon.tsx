import styles from "./SpinnerIcon.module.css";
import { LoaderCircleIcon, type LucideProps } from "lucide-react";

export function SpinnerIcon(props: LucideProps) {
  return <LoaderCircleIcon {...props} className={styles.customLoader} />;
}
