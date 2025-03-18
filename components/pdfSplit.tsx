"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Upload, FileUp, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import SubscriptionModal from "./subscriptionModal";

interface SplitPage {
  number: number;
  blob: Blob;
}

const FREE_USES_LIMIT = parseInt(process.env.FREE_USES_LIMIT as string);

export function PdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitPages, setSplitPages] = useState<SplitPage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const { user, isSignedIn } = useUser();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // Add effect to initialize usage count from localStorage on mount
  useEffect(() => {
    const storedCount = localStorage.getItem("pdfSplitUsageCount");
    if (storedCount) {
      setUsageCount(parseInt(storedCount));
    }
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
    // eslint-disable-next-line
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      if (!user?.publicMetadata?.stripeSubscriptionId) {
        setHasActiveSubscription(false);
        return;
      }

      const response = await fetch(
        `/api/check-subscription?subscriptionId=${user.publicMetadata.stripeSubscriptionId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check subscription status");
      }

      const responseJson = await response.json();

      const activeSubscription =
        responseJson.isActive === true ||
        (responseJson.isActive === false &&
          responseJson.currentPeriodEnd * 1000 > Date.now());

      setHasActiveSubscription(activeSubscription);

      // Clear usage count if user has active subscription
      if (user && activeSubscription) {
        localStorage.removeItem("pdfSplitUsageCount");
        setUsageCount(0);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasActiveSubscription(false);
    }
  };

  const incrementUsageCount = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem("pdfSplitUsageCount", newCount.toString());
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile?.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Please upload a PDF file",
      });
      return;
    }
    setFile(selectedFile);
    setSplitPages([]); // Reset split pages when new file is selected
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Please upload a PDF file",
      });
      return;
    }
    setFile(droppedFile);
    setSplitPages([]); // Reset split pages when new file is selected
  };

  const processPDF = async () => {
    if (!file) return;

    if (isSignedIn && !hasActiveSubscription) {
      setShowSubscribeModal(true);
      return;
    }

    if (!isSignedIn && usageCount >= FREE_USES_LIMIT) {
      setShowSubscribeModal(true);
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);
      setSplitPages([]);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      const zip = new JSZip();
      const newPages: SplitPage[] = [];

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(page);

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });

        zip.file(`page_${i + 1}.pdf`, blob);
        newPages.push({ number: i + 1, blob });

        setProgress(((i + 1) / pageCount) * 100);
      }

      setSplitPages(newPages);
      
      toast.success("Success!", {
        description: "Your PDF has been split successfully",
      });
      
      if (!hasActiveSubscription) {
        incrementUsageCount();
      }
    } catch (error) {
      toast.error("Error", {
        description: `Failed to process the PDF: ${error}`,
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const downloadSinglePage = (page: SplitPage) => {
    saveAs(page.blob, `${file?.name.split(".")[0]}_page_${page.number}.pdf`);
  };

  const downloadAllPagesZip = async () => {
    const zip = new JSZip();

    splitPages.forEach((page) => {
      zip.file(
        `${file?.name.split(".")[0]}_page_${page.number}.pdf`,
        page.blob
      );
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${file?.name.split(".")[0]}_all_pages.zip`);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <Card className="p-8 bg-white shadow-lg">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="flex flex-col items-center justify-center">
            <div
              className={`
                w-full 
                border-2 
                border-dashed 
                rounded-lg 
                p-12
                min-h-[200px]
                flex
                flex-col
                items-center
                justify-center
                transition-all
                duration-200
                ease-in-out
                ${file ? "border-red-500 bg-red-50" : "border-gray-300"}
                ${isDragging ? "border-red-400 bg-red-50 scale-[1.02]" : ""}
                ${!file && !isDragging && "hover:border-red-300 hover:bg-red-50"}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                id="pdf-upload"
                disabled={processing}
                className="hidden"
              />
              <label
                htmlFor="pdf-upload"
                className={`
                  flex 
                  flex-col 
                  items-center 
                  justify-center 
                  cursor-pointer 
                  space-y-4
                  transition-transform
                  duration-200
                  ${isDragging ? "scale-110" : ""}
                `}
              >
                <Upload
                  className={`
                    w-16 
                    h-16 
                    transition-colors 
                    duration-200
                    ${file ? "text-red-500" : "text-gray-400"}
                    ${isDragging ? "text-red-500" : ""}
                  `}
                />
                <span
                  className={`
                    text-lg
                    text-center
                    transition-colors
                    duration-200
                    ${isDragging ? "text-red-500" : "text-gray-600"}
                  `}
                >
                  {file
                    ? file.name
                    : isDragging
                    ? "Drop your PDF file here"
                    : "Click to upload or drag and drop a PDF file"}
                </span>
              </label>
            </div>
          </div>

          {/* Split Button and Progress */}
          {file && (
            <div className="space-y-4">
              <Button
                onClick={processPDF}
                disabled={processing}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
              >
                <FileUp className="mr-2 h-5 w-5" />
                {processing ? "Processing..." : "Split PDF"}
              </Button>

              {processing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-sm text-gray-600">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Split Pages Results */}
          {splitPages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-gray-900">
                Split Pages
              </h3>
              <Button
                onClick={downloadAllPagesZip}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download All Pages as ZIP
              </Button>

              <div className="grid grid-cols-2 gap-2">
                {splitPages.map((page) => (
                  <Button
                    key={page.number}
                    onClick={() => downloadSinglePage(page)}
                    variant="outline"
                    className="w-full border-red-200 hover:bg-red-50 text-red-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Page {page.number}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
      <SubscriptionModal
        open={showSubscribeModal}
        onOpenChange={setShowSubscribeModal}
      />
    </div>
  );
}