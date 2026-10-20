import {useEffect,useRef} from 'react';
import {Wallet,X} from 'lucide-react';
type Any=any;
export function Field({label,children,hint}:Any){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function Empty({icon:Icon=Wallet,title,detail,action}:Any){return <div className="empty"><span className="empty-icon"><Icon size={27}/></span><h3>{title}</h3><p>{detail}</p>{action}</div>;}
export function Modal({title,children,onClose,onSubmit,submit='Save',busy}:Any){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();},[]);return <dialog ref={ref} onCancel={onClose} className="modal"><form onSubmit={onSubmit}><div className="modal-head"><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={21}/></button></div><div className="modal-body">{children}</div>{onSubmit&&<div className="modal-actions"><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy?'Saving…':submit}</button></div>}</form></dialog>;}
