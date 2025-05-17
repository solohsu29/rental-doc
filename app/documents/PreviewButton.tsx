"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface PreviewButtonProps {
  fileUrl: string;
  fileName: string;
}

export default function PreviewButton({ fileUrl, fileName }: PreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Eye className="w-4 h-4 mr-1" /> Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview: {fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center min-h-[400px]">
          {isPdf ? (
            <iframe
              src={fileUrl}
              title={fileName}
              width="100%"
              height="600px"
              style={{ border: 0 }}
            />
          ) : isImage ? (
            <img src={fileUrl} alt={fileName} className="max-h-[500px] max-w-full object-contain" />
          ) : (
            <a href={fileUrl} download={fileName} className="text-blue-600 underline hover:text-blue-800">
              Download {fileName}
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
