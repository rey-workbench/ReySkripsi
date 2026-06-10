using System;
using System.Drawing;
using System.Windows.Forms;
using System.IO;
using Microsoft.Win32;
using System.Drawing.Drawing2D;
using System.Reflection;

namespace ReySkripsiInstaller
{
    public class InstallerForm : Form
    {
        private Button btnInstall;
        private Button btnUninstall;
        private Label lblStatus;
        private Panel headerPanel;
        private Label lblTitle;
        private Label lblSubtitle;

        public InstallerForm()
        {
            this.Text = "ReySkripsi Installer";
            this.Size = new Size(450, 300);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;

            // Header Panel
            headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 80;
            headerPanel.BackColor = Color.FromArgb(43, 87, 154); // Word Blue
            this.Controls.Add(headerPanel);

            lblTitle = new Label();
            lblTitle.Text = "ReySkripsi Add-in";
            lblTitle.Font = new Font("Segoe UI", 18, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(20, 15);
            lblTitle.AutoSize = true;
            lblTitle.BackColor = Color.Transparent;
            headerPanel.Controls.Add(lblTitle);

            lblSubtitle = new Label();
            lblSubtitle.Text = "Alat Bantu Penulisan Cerdas untuk Microsoft Word";
            lblSubtitle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.LightGray;
            lblSubtitle.Location = new Point(23, 48);
            lblSubtitle.AutoSize = true;
            lblSubtitle.BackColor = Color.Transparent;
            headerPanel.Controls.Add(lblSubtitle);

            // Body Area
            Label lblDesc = new Label();
            lblDesc.Text = "Klik tombol di bawah ini untuk memasang atau menghapus\nAdd-in ReySkripsi dari komputer Anda secara otomatis.";
            lblDesc.Font = new Font("Segoe UI", 10);
            lblDesc.ForeColor = Color.FromArgb(64, 64, 64);
            lblDesc.Location = new Point(25, 100);
            lblDesc.AutoSize = true;
            this.Controls.Add(lblDesc);

            // Install Button
            btnInstall = new Button();
            btnInstall.Text = "Install Add-in";
            btnInstall.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(16, 124, 65); // Excel/Success Green
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Size = new Size(180, 45);
            btnInstall.Location = new Point(25, 160);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);

            // Uninstall Button
            btnUninstall = new Button();
            btnUninstall.Text = "Uninstall";
            btnUninstall.Font = new Font("Segoe UI", 10);
            btnUninstall.BackColor = Color.White;
            btnUninstall.ForeColor = Color.FromArgb(64, 64, 64);
            btnUninstall.FlatStyle = FlatStyle.Flat;
            btnUninstall.FlatAppearance.BorderColor = Color.LightGray;
            btnUninstall.Size = new Size(180, 45);
            btnUninstall.Location = new Point(225, 160);
            btnUninstall.Cursor = Cursors.Hand;
            btnUninstall.Click += BtnUninstall_Click;
            this.Controls.Add(btnUninstall);

            // Status Label
            lblStatus = new Label();
            lblStatus.Text = "Siap.";
            lblStatus.Font = new Font("Segoe UI", 9, FontStyle.Italic);
            lblStatus.Location = new Point(25, 225);
            lblStatus.AutoSize = true;
            lblStatus.ForeColor = Color.Gray;
            this.Controls.Add(lblStatus);
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            try
            {
                lblStatus.Text = "Status: Menginstal...";
                Application.DoEvents();

                string targetDir = @"C:\Addins";
                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                string targetManifest = Path.Combine(targetDir, "manifest.xml");

                // Membaca manifest.xml dari resource yang ditanamkan (embedded) di dalam EXE
                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("manifest.xml"))
                {
                    if (stream == null)
                    {
                        throw new Exception("File manifest internal tidak ditemukan di dalam installer!");
                    }
                    using (FileStream fileStream = new FileStream(targetManifest, FileMode.Create))
                    {
                        stream.CopyTo(fileStream);
                    }
                }

                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"SOFTWARE\Microsoft\Office\16.0\Wef\Developer"))
                {
                    key.SetValue("ReySkripsi", targetManifest);
                }

                lblStatus.Text = "Status: Berhasil diinstal! Silakan buka Word.";
                lblStatus.ForeColor = Color.Green;
                MessageBox.Show("ReySkripsi berhasil dipasang!\n\nSilakan buka Word -> Buka dokumen kosong -> tab Home -> klik Add-ins -> pilih Developer Add-ins (atau My Add-ins).", "Instalasi Selesai", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal menginstal:\n" + ex.Message, "Error Instalasi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                lblStatus.Text = "Status: Gagal.";
                lblStatus.ForeColor = Color.Red;
            }
        }

        private void BtnUninstall_Click(object sender, EventArgs e)
        {
            try
            {
                lblStatus.Text = "Status: Menghapus...";
                Application.DoEvents();

                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Office\16.0\Wef\Developer", true))
                {
                    if (key != null && key.GetValue("ReySkripsi") != null)
                    {
                        key.DeleteValue("ReySkripsi");
                    }
                }

                string targetManifest = @"C:\Addins\manifest.xml";
                if (File.Exists(targetManifest))
                {
                    File.Delete(targetManifest);
                }

                lblStatus.Text = "Status: Berhasil dihapus dari sistem.";
                lblStatus.ForeColor = Color.Red;
                MessageBox.Show("ReySkripsi telah dihapus sepenuhnya dari Microsoft Word.", "Uninstall Selesai", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal menghapus:\n" + ex.Message, "Error Uninstall", MessageBoxButtons.OK, MessageBoxIcon.Error);
                lblStatus.Text = "Status: Gagal dihapus.";
                lblStatus.ForeColor = Color.Red;
            }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
