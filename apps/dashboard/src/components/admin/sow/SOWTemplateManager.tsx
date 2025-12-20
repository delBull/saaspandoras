"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash, FileText } from "lucide-react";
import { toast } from "sonner";
import { getSOWTemplates, saveSOWTemplate } from "@/actions/sow";
import { Badge } from "@/components/ui/badge";

export function SOWTemplateManager({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);

    useEffect(() => {
        if (open) loadTemplates();
    }, [open]);

    async function loadTemplates() {
        setLoading(true);
        const res = await getSOWTemplates();
        if (res.success && res.data) {
            setTemplates(res.data);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>SOW Templates Manager</DialogTitle>
                </DialogHeader>

                {editingTemplate ? (
                    <SOWTemplateEditor
                        template={editingTemplate}
                        onCancel={() => setEditingTemplate(null)}
                        onSave={() => { setEditingTemplate(null); loadTemplates(); }}
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => setEditingTemplate({ tier: 'TIER_1', name: '', content: '' })} className="bg-lime-500 text-black hover:bg-lime-400">
                                <Plus className="w-4 h-4 mr-2" /> New Template
                            </Button>
                        </div>

                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Tier</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map(t => (
                                        <TableRow key={t.id} className="border-zinc-800">
                                            <TableCell className="font-medium text-white">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-zinc-500" />
                                                    {t.name}
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{t.tier}</Badge></TableCell>
                                            <TableCell>
                                                <div className={`w-2 h-2 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost" onClick={() => setEditingTemplate(t)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {templates.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-zinc-500 py-8">No templates found. System uses defaults.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SOWTemplateEditor({ template, onCancel, onSave }: { template: any, onCancel: () => void, onSave: () => void }) {
    const [form, setForm] = useState({ ...template });
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        const res = await saveSOWTemplate({
            id: form.id,
            tier: form.tier,
            name: form.name,
            content: form.content
        });
        if (res.success) {
            toast.success("Template saved");
            onSave();
        } else {
            toast.error("Error saving template");
        }
        setSaving(false);
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-900" placeholder="e.g. Standard Tier 1" />
                </div>
                <div className="space-y-2">
                    <Label>Tier</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                        value={form.tier}
                        onChange={e => setForm({ ...form, tier: e.target.value })}
                    >
                        <option value="TIER_1">Tier 1 (Viability)</option>
                        <option value="TIER_2">Tier 2 (Architecture)</option>
                        <option value="TIER_3">Tier 3 (Deployment)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>HTML Content</Label>
                <div className="text-xs text-zinc-400 mb-2">
                    Available variables: <code className="bg-zinc-800 px-1 rounded text-lime-400">{"${v.sowId}"}</code>, <code className="bg-zinc-800 px-1 rounded text-lime-400">{"${v.date}"}</code>, <code className="bg-zinc-800 px-1 rounded text-lime-400">{"${v.clientName}"}</code>, <code className="bg-zinc-800 px-1 rounded text-lime-400">{"${v.projectName}"}</code>, <code className="bg-zinc-800 px-1 rounded text-lime-400">{"${v.amount}"}</code>
                </div>
                <Textarea
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    className="bg-zinc-900 font-mono h-[400px]"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-lime-500 text-black font-bold hover:bg-lime-400">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : null} Save Template
                </Button>
            </div>
        </div>
    );
}
