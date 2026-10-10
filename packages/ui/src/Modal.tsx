import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
export interface ModalProps {open:boolean;title:string;children:ReactNode;onClose:()=>void;primaryAction?:{label:string;onClick:()=>void};secondaryAction?:{label:string;onClick:()=>void}}
export function Modal({open,title,children,onClose,primaryAction,secondaryAction}:ModalProps) {
 const dialog=useRef<HTMLDialogElement>(null);const titleId=useId();
 useEffect(()=>{const node=dialog.current;const trigger=document.activeElement instanceof HTMLElement?document.activeElement:null;if(open&&!node?.open)node?.showModal();return()=>{if(node?.open)node.close();if(trigger?.isConnected)trigger.focus();};},[open]);
 if(!open)return null;
 return <dialog ref={dialog} className="porter-modal" aria-labelledby={titleId} onCancel={e=>{e.preventDefault();onClose();}}><h2 id={titleId}>{title}</h2><div className="modal-content">{children}</div><div className="actions"><Button autoFocus variant="secondary" onClick={secondaryAction?.onClick??onClose}>{secondaryAction?.label??'Close'}</Button>{primaryAction&&<Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>}</div></dialog>;
}
