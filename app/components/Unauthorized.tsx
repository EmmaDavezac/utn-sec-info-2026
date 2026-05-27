'use client';

interface UnauthorizedProps {
  title?: string;
  message?: string;
}

export const Unauthorized = ({
  title = "Acceso Denegado",
  message = "No tienes los permisos necesarios para ver esta página.",
}: UnauthorizedProps) => {
  return (
    <div className="flex flex-col flex-1 items-center justify-center h-full text-center p-6 text-zinc-500 dark:text-zinc-400">
      <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{title}</h3>
      <p className="mt-2">{message}</p>
    </div>
  );
};