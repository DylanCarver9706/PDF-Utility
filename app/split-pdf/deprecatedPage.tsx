"use client";

import { useState, useEffect } from "react";
import { useUser, SignUp, SignUpButton } from "@clerk/nextjs";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Upload, FileUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SplitPage {
  number: number;
  blob: Blob;
}

const FREE_USES_LIMIT = 3;

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitPages, setSplitPages] = useState<SplitPage[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { user, isSignedIn } = useUser();
  const [isDragging, setIsDragging] = useState(false);

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

  const redirectToCheckout = async () => {
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Checkout error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(errorText);
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Client error:", error);
      toast.error("Error", {
        description: `Something went wrong with the checkout process: ${error}`,
      });
    }
  };

  const handleSplitPDF = async () => {
    if (isSignedIn && !hasActiveSubscription) {
      //   setShowAuthModal(true);
      return;
    }

    // if (!isSignedIn && usageCount >= FREE_USES_LIMIT) {
    //   setShowAuthModal(true);
    //   return;
    // }

    await processPDF();
    if (!hasActiveSubscription) {
      incrementUsageCount();
    }
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

      const content = await zip.generateAsync({ type: "blob" });
      setSplitPages(newPages);

      toast.success("Success!", {
        description: "Your PDF has been split successfully",
      });

      return content; // Return zip content but don't automatically download
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
      <Card className="p-8 bg-[hsl(222,47%,13%)]">
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
                ${file ? "border-green-500" : "border-[hsl(222,47%,25%)]"}
                ${
                  isDragging
                    ? "border-[hsl(210,40%,98%)] bg-[hsl(222,47%,15%)] scale-[1.02]"
                    : "bg-[hsl(222,47%,11%)]"
                }
                ${!file && !isDragging && "hover:border-[hsl(222,47%,35%)]"}
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
                    ${file ? "text-green-500" : "text-[hsl(210,40%,80%)]"}
                    ${isDragging ? "text-[hsl(210,40%,98%)]" : ""}
                  `}
                />
                <span
                  className={`
                  text-lg
                  text-center
                  transition-colors
                  duration-200
                  ${
                    isDragging
                      ? "text-[hsl(210,40%,98%)]"
                      : "text-[hsl(210,40%,80%)]"
                  }
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

          {/* Usage Counter */}
          {!isSignedIn && usageCount > 0 && !hasActiveSubscription && (
            <div className="text-center text-sm text-[hsl(210,40%,80%)]">
              {FREE_USES_LIMIT - usageCount} free uses remaining
            </div>
          )}

          {/* Split Button and Progress */}
          {!isSignedIn &&
            usageCount > 0 &&
            !hasActiveSubscription &&
            usageCount >= FREE_USES_LIMIT && (
              <div className="mt-20 flex items-center justify-center">
                <SignUpButton>Sign up</SignUpButton>
              </div>
            )}

          {file && (
            <div className="space-y-4">
              <Button
                onClick={handleSplitPDF}
                disabled={processing}
                className="w-full bg-[hsl(210,60%,50%)] hover:bg-[hsl(210,60%,45%)] text-white"
              >
                <FileUp className="mr-2 h-4 w-4" />
                {processing ? "Processing..." : "Split PDF"}
              </Button>

              {processing && (
                <div className="space-y-2">
                  <Progress
                    value={progress}
                    className="bg-[hsl(222,47%,25%)]"
                  />
                  <p className="text-center text-sm text-[hsl(210,40%,80%)]">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Split Pages Results */}
          {splitPages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-[hsl(210,40%,98%)]">
                Split Pages
              </h3>
              <Button
                onClick={downloadAllPagesZip}
                className="w-full bg-[hsl(210,60%,50%)] hover:bg-[hsl(210,60%,45%)] text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All Pages as ZIP
              </Button>

              <div className="grid grid-cols-1 gap-2">
                {splitPages.map((page) => (
                  <Button
                    key={page.number}
                    onClick={() => downloadSinglePage(page)}
                    className="w-full bg-[hsl(210,60%,50%)] hover:bg-[hsl(210,60%,45%)] text-white"
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

      {/* Subscribe Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-[850px] max-h-[85vh] bg-[hsl(222,47%,13%)] border border-[hsl(222,47%,25%)] p-5 rounded-[8px]">
          {/* Reduce the height gap between the title and description */}
          <DialogHeader className="space-y-8">
            <DialogTitle className="text-4xl font-bold text-center text-[hsl(210,40%,98%)]">
              Unlock Unlimited PDF Splitting
            </DialogTitle>
            <DialogDescription className="text-center space-y-6">
              <p className="text-[hsl(210,40%,80%)] text-xl leading-relaxed">
                {isSignedIn
                  ? "Get unlimited access to PDF Utility and split as many PDFs as you need"
                  : "You've reached the free limit. Subscribe now to unlock unlimited PDF splitting and more features coming soon!"}
              </p>

              {/* Pricing Section */}
              <div className="bg-[hsl(222,47%,11%)] rounded-2xl p-8 mt-6">
                <div className="flex flex-col items-center gap-2">
                  {/* Put a top gap/margin here */}
                  <div className="flex items-baseline justify-center gap-2 text-[hsl(210,40%,98%)]">
                    <span className="text-5xl font-bold">$9.99</span>
                    <span className="text-xl text-[hsl(210,40%,80%)]">
                      / month
                    </span>
                  </div>
                  <ul className="mt-6 space-y-4 text-lg text-[hsl(210,40%,90%)]">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Unlimited PDF
                      Splitting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> High-Speed
                      Processing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Secure File
                      Handling
                    </li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 mt-8">
            {!isSignedIn ? (
              <div className="bg-[hsl(222,47%,11%)] p-8 rounded-xl w-full max-w-md mx-auto flex justify-center items-center">
                <SignUp />
              </div>
            ) : (
              <Button
                onClick={redirectToCheckout}
                className="bg-[hsl(210,60%,50%)] hover:bg-[hsl(210,60%,45%)] text-white h-16 px-16 text-xl font-semibold rounded-xl"
              >
                Subscribe Now
              </Button>
            )}

            <p className="text-[hsl(210,40%,80%)] text-sm">
              Cancel anytime. Secure payment via Stripe.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
