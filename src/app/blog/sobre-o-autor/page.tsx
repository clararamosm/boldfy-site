import Link from 'next/link';
import { Mail, MoveLeft } from 'lucide-react';

export default function SobreOAutorPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Back Link */}
        <div className="mb-10">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoveLeft className="w-4 h-4 mr-2" />
            Voltar para o Blog
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 md:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Foto de Perfil (Mockup) */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-secondary overflow-hidden border-4 border-background flex items-center justify-center">
                {/* Aqui entrará a foto real */}
                <span className="text-4xl font-black text-muted-foreground/30">?</span>
              </div>
            </div>

            {/* Texto e Background */}
            <div className="flex-1">
              <h1 className="font-headline text-3xl font-black text-foreground mb-2">
                Nome do Autor
              </h1>
              <p className="text-primary font-medium mb-6">
                Cargo / Profissão
              </p>
              
              <div className="prose prose-sm md:prose-base dark:prose-invert text-muted-foreground max-w-none mb-8">
                <p>
                  Olá! Esta é uma página de espaço reservado (mockup). Em breve, este texto será substituído pelo seu background real. Você poderá compartilhar sua jornada, experiências profissionais, e sobre quais tópicos costuma escrever no blog da Boldfy.
                </p>
                <p>
                  Sinta-se à vontade para rechear este espaço com sua história, sua visão de mercado, e como suas ideias conectam com o propósito da empresa.
                </p>
              </div>

              {/* Redes Sociais */}
              <div className="flex items-center gap-4 border-t border-border pt-6">
                <span className="text-sm font-semibold text-foreground mr-2">Conecte-se:</span>
                
                {/* LinkedIn */}
                <a 
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>

                {/* Substack (Ícone em SVG) */}
                <a 
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FF6719]/10 text-[#FF6719] hover:bg-[#FF6719]/20 transition-colors"
                  aria-label="Substack"
                >
                  <svg 
                    width="20" height="20" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM22.539 12.322v11.538l-10.5-5.836-10.5 5.836V12.322h21zM1.46 1.458h21.08v2.836H1.46V1.458z"/>
                  </svg>
                </a>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
