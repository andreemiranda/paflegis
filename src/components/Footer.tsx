import React from 'react';
import { Building2, ShieldCheck, FileCheck, Code2, ExternalLink, Cookie, Scale, Shield, Lock, Github } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-10 pb-6 mt-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">

          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/images/logo.jpg" alt="Paflegis" className="h-8 w-auto rounded-lg" />
              <span className="font-bold text-xl tracking-tight text-white font-sans">Paflegis</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aplicativo independente de consulta e facilitação de acesso às informações legislativas de Pedro Afonso - TO.
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Em Conformidade com a LGPD
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium w-fit">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                Lei de Acesso à Informação
              </span>
            </div>
          </div>

          {/* Col 2: Módulos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Módulos de Consulta</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><button onClick={() => onSelectTab('materias')} className="hover:text-white transition-colors">Matérias Legislativas</button></li>
              <li><button onClick={() => onSelectTab('normas')} className="hover:text-white transition-colors">Normas Jurídicas (Leis/Decretos)</button></li>
              <li><button onClick={() => onSelectTab('sessoes')} className="hover:text-white transition-colors">Sessões Plenárias e Atas</button></li>
              <li>
                <a href="/api-docs" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors font-medium text-amber-400 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" /> Documentação da API
                  <ExternalLink className="w-3 h-3 text-amber-400/80" />
                </a>
              </li>
              <li>
                <a href="https://github.com/andreemiranda/paflegis" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <Github className="w-3.5 h-3.5" /> Repositório no GitHub
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Informações Legais</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onSelectTab('politica-de-privacidade')} className="hover:text-white transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Política de Privacidade (LGPD)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('termos-de-uso')} className="hover:text-white transition-colors">Termos de Uso do Serviço</button>
              </li>
              <li>
                <button onClick={() => onSelectTab('politica-de-cookies')} className="hover:text-white transition-colors flex items-center gap-1">
                  <Cookie className="w-3.5 h-3.5 text-amber-400" /> Política de Cookies
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('aviso-legal')} className="hover:text-white transition-colors flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-violet-400" /> Aviso Legal
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('aviso-de-dados-publicos')} className="hover:text-white transition-colors flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" /> Aviso de Dados Públicos (LAI)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Privacidade + Fonte */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Privacidade</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <button onClick={() => onSelectTab('central-de-privacidade')} className="hover:text-white transition-colors flex items-center gap-1 font-semibold text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-blue-400" /> Central de Privacidade
                  </button>
                </li>
                <li>
                  <a href="mailto:privacidade@paflegis.com" className="hover:text-white transition-colors flex items-center gap-1">
                    Contato do Encarregado (DPO)
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fonte de Dados</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Pedro Afonso - TO</p>
              <a
                href="https://sapl.pedroafonso.to.leg.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition-colors"
              >
                <span>Portal Oficial SAPL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Aviso legal */}
        <div className="my-5 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Aviso Legal e Natureza Independente:
          </p>
          <p className="text-slate-400">
            "Este aplicativo foi desenvolvido por <strong>Paflegis</strong> utilizando dados públicos obtidos mediante a API aberta do SAPL. Os arquivos, leis e documentos são de domínio público e interesse de toda a sociedade (Lei nº 12.527/2011). Este aplicativo é uma ferramenta cívica independente e não se confunde com o portal governamental oficial."
          </p>
        </div>

        {/* Creative Commons + Interlegis */}
        <div className="flex items-center gap-4 py-4 border-t border-slate-800">
          <a href="http://www.interlegis.leg.br/" target="_blank" rel="noopener noreferrer" className="shrink-0">
            <img src="https://sapl.pedroafonso.to.leg.br/static/sapl/frontend/img/logo_interlegis.png" alt="Logo do Interlegis" className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity" />
          </a>
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="shrink-0">
            <img src="https://sapl.pedroafonso.to.leg.br/static/sapl/frontend/img/logo_cc.png" alt="Logo do Creative Commons BY SA" className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity" />
          </a>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Conteúdo e dados sob licença{' '}
            <a href="https://creativecommons.org" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">Creative Commons</a> 4.0
            <br />
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">Atribuir Fonte - Compartilhar Igual</a>
          </p>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-3 items-center text-[10px] text-slate-500 uppercase tracking-widest font-medium pt-1">
          <div>
            Desenvolvido por <strong className="text-slate-300 font-bold">Paflegis</strong> &copy; {new Date().getFullYear()}
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span>SAPL Online</span>
            </div>
            <span>v2.1.0-prod</span>
          </div>
          <div />
        </div>
      </div>
    </footer>
  );
};
